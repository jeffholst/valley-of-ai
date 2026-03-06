#!/usr/bin/env node

/**
 * Transactional Logger for Valley of AI Agent
 * 
 * Provides structured logging for app generation pipeline with:
 * - Transaction boundaries (start/end)
 * - Step-by-step tracking with sequence numbers
 * - Error handling with retry support
 * - Duration and token tracking
 * 
 * Usage:
 *   import { AgentLogger, StepType, ErrorCode } from './logger.js'
 *   
 *   const logger = new AgentLogger('openclaw-dev-agent', 'gpt-5.1')
 *   const runId = logger.startTransaction('my-app', 'suggestion-001')
 *   
 *   logger.stepCompleted(runId, StepType.GENERATE_HTML, 4500, { tokensIn: 3200, tokensOut: 2800 })
 *   logger.stepFailed(runId, StepType.GIT_COMMIT, 1200, ErrorCode.GIT_AUTH_ERROR, 'Auth failed')
 *   
 *   logger.endTransaction(runId, 'success', ['index.html', 'meta.json'])
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

/**
 * Step types for the app generation pipeline
 */
export const StepType = {
  SELECT_SUGGESTION: 'SELECT_SUGGESTION',
  GENERATE_HTML: 'GENERATE_HTML',
  GENERATE_THUMBNAIL: 'GENERATE_THUMBNAIL',
  CREATE_META_JSON: 'CREATE_META_JSON',
  VALIDATE_APP: 'VALIDATE_APP',
  GIT_BRANCH: 'GIT_BRANCH',
  GIT_COMMIT: 'GIT_COMMIT',
  CREATE_PR: 'CREATE_PR',
  PR_REVIEW: 'PR_REVIEW',
  MERGE_PR: 'MERGE_PR',
  UPDATE_REGISTRY: 'UPDATE_REGISTRY',
  DEPLOY: 'DEPLOY',
}

/**
 * Step sequence numbers (default order)
 */
export const StepSequence = {
  [StepType.SELECT_SUGGESTION]: 1,
  [StepType.GENERATE_HTML]: 2,
  [StepType.GENERATE_THUMBNAIL]: 3,
  [StepType.CREATE_META_JSON]: 4,
  [StepType.VALIDATE_APP]: 5,
  [StepType.GIT_BRANCH]: 6,
  [StepType.GIT_COMMIT]: 7,
  [StepType.CREATE_PR]: 8,
  [StepType.PR_REVIEW]: 9,
  [StepType.MERGE_PR]: 10,
  [StepType.UPDATE_REGISTRY]: 11,
  [StepType.DEPLOY]: 12,
}

/**
 * Status values for steps and transactions
 */
export const Status = {
  STARTED: 'started',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed',
  RETRYING: 'retrying',
  SKIPPED: 'skipped',
  CANCELLED: 'cancelled',
}

/**
 * Error codes for structured error logging
 */
export const ErrorCode = {
  LLM_TIMEOUT: 'LLM_TIMEOUT',
  LLM_RATE_LIMIT: 'LLM_RATE_LIMIT',
  LLM_ERROR: 'LLM_ERROR',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  GIT_CONFLICT: 'GIT_CONFLICT',
  GIT_AUTH_ERROR: 'GIT_AUTH_ERROR',
  GH_API_ERROR: 'GH_API_ERROR',
  FILE_WRITE_ERROR: 'FILE_WRITE_ERROR',
  PARSE_ERROR: 'PARSE_ERROR',
  UNKNOWN: 'UNKNOWN',
}

/**
 * Transaction state for tracking in-progress transactions
 */
class Transaction {
  constructor(runId, appId, agent, llmModel, suggestionId = null) {
    this.runId = runId
    this.appId = appId
    this.agent = agent
    this.llmModel = llmModel
    this.suggestionId = suggestionId
    this.startTime = Date.now()
    this.totalTokensIn = 0
    this.totalTokensOut = 0
    this.filesCreated = []
    this.currentStep = null
    this.stepAttempts = {}
  }
}

/**
 * Main logger class for transactional logging
 */
export class AgentLogger {
  /**
   * @param {string} agentId - Agent identifier (e.g., 'openclaw-dev-agent')
   * @param {string} llmModel - LLM model being used (e.g., 'gpt-5.1')
   * @param {string} logsDir - Base directory for logs (default: 'logs')
   */
  constructor(agentId, llmModel, logsDir = null) {
    this.agentId = agentId
    this.llmModel = llmModel
    this.logsDir = logsDir || path.join(rootDir, 'logs')
    this.transactions = new Map()
    this.runCounter = 0
  }

  /**
   * Get current date parts for file path
   */
  _getDateParts() {
    const now = new Date()
    return {
      year: now.getFullYear().toString(),
      month: (now.getMonth() + 1).toString().padStart(2, '0'),
      day: now.getDate().toString().padStart(2, '0'),
    }
  }

  /**
   * Get the log file path for today
   */
  _getLogFilePath() {
    const { year, month, day } = this._getDateParts()
    return path.join(this.logsDir, year, month, `${day}.jsonl`)
  }

  /**
   * Ensure log directory exists
   */
  _ensureLogDir() {
    const logFile = this._getLogFilePath()
    const logDir = path.dirname(logFile)
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true })
    }
  }

  /**
   * Write a log entry to the daily log file
   */
  _writeLog(entry) {
    this._ensureLogDir()
    const logFile = this._getLogFilePath()
    const line = JSON.stringify(entry) + '\n'
    fs.appendFileSync(logFile, line, 'utf8')
  }

  /**
   * Generate a unique run ID
   */
  _generateRunId() {
    const { year, month, day } = this._getDateParts()
    this.runCounter++
    const counter = this.runCounter.toString().padStart(4, '0')
    return `run-${year}-${month}-${day}-${counter}`
  }

  /**
   * Get current ISO timestamp
   */
  _timestamp() {
    return new Date().toISOString()
  }

  /**
   * Start a new transaction (app generation)
   * 
   * @param {string} appId - The app ID being generated
   * @param {string|null} suggestionId - Optional suggestion ID if implementing a user suggestion
   * @returns {string} The runId for this transaction
   */
  startTransaction(appId, suggestionId = null) {
    const runId = this._generateRunId()
    const txn = new Transaction(runId, appId, this.agentId, this.llmModel, suggestionId)
    this.transactions.set(runId, txn)

    const entry = {
      timestamp: this._timestamp(),
      runId,
      type: 'TRANSACTION_START',
      appId,
      status: Status.STARTED,
      agent: this.agentId,
      llmModel: this.llmModel,
    }
    
    if (suggestionId) {
      entry.suggestionId = suggestionId
    }

    this._writeLog(entry)
    return runId
  }

  /**
   * Log a step as started
   * 
   * @param {string} runId - The transaction run ID
   * @param {string} step - Step type from StepType
   */
  stepStarted(runId, step) {
    const txn = this.transactions.get(runId)
    if (!txn) {
      console.error(`Unknown transaction: ${runId}`)
      return
    }

    txn.currentStep = step
    txn.stepAttempts[step] = (txn.stepAttempts[step] || 0) + 1

    const entry = {
      timestamp: this._timestamp(),
      runId,
      type: 'STEP',
      step,
      seq: StepSequence[step] || 0,
      status: Status.STARTED,
    }

    if (txn.stepAttempts[step] > 1) {
      entry.attempt = txn.stepAttempts[step]
    }

    this._writeLog(entry)
  }

  /**
   * Log a step as completed
   * 
   * @param {string} runId - The transaction run ID
   * @param {string} step - Step type from StepType
   * @param {number} durationMs - Duration in milliseconds
   * @param {object} options - Additional options
   * @param {number} options.tokensIn - Input tokens used
   * @param {number} options.tokensOut - Output tokens used
   * @param {object} options.details - Additional details object
   */
  stepCompleted(runId, step, durationMs, options = {}) {
    const txn = this.transactions.get(runId)
    if (!txn) {
      console.error(`Unknown transaction: ${runId}`)
      return
    }

    // Track totals
    if (options.tokensIn) txn.totalTokensIn += options.tokensIn
    if (options.tokensOut) txn.totalTokensOut += options.tokensOut

    const entry = {
      timestamp: this._timestamp(),
      runId,
      type: 'STEP',
      step,
      seq: StepSequence[step] || 0,
      status: Status.COMPLETED,
      durationMs,
    }

    if (options.tokensIn) entry.tokensIn = options.tokensIn
    if (options.tokensOut) entry.tokensOut = options.tokensOut
    if (options.details) entry.details = options.details
    if (txn.stepAttempts[step] > 1) entry.attempt = txn.stepAttempts[step]

    this._writeLog(entry)
    txn.currentStep = null
  }

  /**
   * Log a step as failed
   * 
   * @param {string} runId - The transaction run ID
   * @param {string} step - Step type from StepType
   * @param {number} durationMs - Duration in milliseconds
   * @param {string} errorCode - Error code from ErrorCode
   * @param {string} errorMessage - Human-readable error message
   * @param {boolean} retryable - Whether the error is retryable
   */
  stepFailed(runId, step, durationMs, errorCode, errorMessage, retryable = false) {
    const txn = this.transactions.get(runId)
    if (!txn) {
      console.error(`Unknown transaction: ${runId}`)
      return
    }

    const entry = {
      timestamp: this._timestamp(),
      runId,
      type: 'STEP',
      step,
      seq: StepSequence[step] || 0,
      status: Status.FAILED,
      durationMs,
      error: {
        code: errorCode,
        message: errorMessage,
        retryable,
      },
    }

    if (txn.stepAttempts[step] > 1) entry.attempt = txn.stepAttempts[step]

    this._writeLog(entry)
  }

  /**
   * Log a step as retrying
   * 
   * @param {string} runId - The transaction run ID
   * @param {string} step - Step type from StepType
   */
  stepRetrying(runId, step) {
    const txn = this.transactions.get(runId)
    if (!txn) {
      console.error(`Unknown transaction: ${runId}`)
      return
    }

    txn.stepAttempts[step] = (txn.stepAttempts[step] || 0) + 1

    const entry = {
      timestamp: this._timestamp(),
      runId,
      type: 'STEP',
      step,
      seq: StepSequence[step] || 0,
      status: Status.RETRYING,
      attempt: txn.stepAttempts[step],
    }

    this._writeLog(entry)
  }

  /**
   * Log a step as skipped
   * 
   * @param {string} runId - The transaction run ID
   * @param {string} step - Step type from StepType
   * @param {string} reason - Reason for skipping
   */
  stepSkipped(runId, step, reason = null) {
    const entry = {
      timestamp: this._timestamp(),
      runId,
      type: 'STEP',
      step,
      seq: StepSequence[step] || 0,
      status: Status.SKIPPED,
    }

    if (reason) entry.details = { reason }

    this._writeLog(entry)
  }

  /**
   * Record a file that was created during this transaction
   * 
   * @param {string} runId - The transaction run ID
   * @param {string} fileName - Name of the file created
   */
  fileCreated(runId, fileName) {
    const txn = this.transactions.get(runId)
    if (txn) {
      txn.filesCreated.push(fileName)
    }
  }

  /**
   * End a transaction
   * 
   * @param {string} runId - The transaction run ID
   * @param {'success'|'failed'|'cancelled'} status - Final status
   * @param {string[]} filesCreated - Optional override for files created
   */
  endTransaction(runId, status = 'success', filesCreated = null) {
    const txn = this.transactions.get(runId)
    if (!txn) {
      console.error(`Unknown transaction: ${runId}`)
      return
    }

    const totalDurationMs = Date.now() - txn.startTime

    const entry = {
      timestamp: this._timestamp(),
      runId,
      type: 'TRANSACTION_END',
      appId: txn.appId,
      status,
      totalDurationMs,
      totalTokensIn: txn.totalTokensIn,
      totalTokensOut: txn.totalTokensOut,
      filesCreated: filesCreated || txn.filesCreated,
    }

    this._writeLog(entry)
    this.transactions.delete(runId)
  }

  /**
   * Convenience method: Execute a step with automatic timing and error handling
   * 
   * @param {string} runId - The transaction run ID
   * @param {string} step - Step type from StepType
   * @param {Function} fn - Async function to execute
   * @param {object} options - Options for the step
   * @returns {*} Result from the function
   */
  async executeStep(runId, step, fn, options = {}) {
    this.stepStarted(runId, step)
    const startTime = Date.now()

    try {
      const result = await fn()
      const durationMs = Date.now() - startTime
      this.stepCompleted(runId, step, durationMs, {
        tokensIn: options.tokensIn,
        tokensOut: options.tokensOut,
        details: options.details,
      })
      return result
    } catch (error) {
      const durationMs = Date.now() - startTime
      const errorCode = options.errorCode || ErrorCode.UNKNOWN
      this.stepFailed(runId, step, durationMs, errorCode, error.message, options.retryable || false)
      throw error
    }
  }
}

// Export a singleton for simple usage
export const logger = new AgentLogger('openclaw-dev-agent', 'gpt-5.1')

// CLI usage example
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log('Logger module loaded. Example usage:')
  console.log('')
  console.log('import { AgentLogger, StepType, ErrorCode } from "./logger.js"')
  console.log('')
  console.log('const logger = new AgentLogger("openclaw-dev-agent", "gpt-5.1")')
  console.log('const runId = logger.startTransaction("my-app")')
  console.log('logger.stepCompleted(runId, StepType.GENERATE_HTML, 4500, { tokensIn: 3200, tokensOut: 2800 })')
  console.log('logger.endTransaction(runId, "success")')
}

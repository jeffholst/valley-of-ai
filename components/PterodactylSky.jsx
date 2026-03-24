'use client';

export default function PterodactylSky({ pterodactyls, onKill }) {
  return (
    <div className="pterodactyl-sky" aria-hidden="true">
      {pterodactyls.map((p) => (
        <div
          key={p.id}
          onPointerDown={() => onKill(p.id)}
          className={`pterodactyl-flyer ${p.direction === 'left' ? 'pterodactyl-left' : 'pterodactyl-right'}${p.dead ? ' is-dead' : ''}`}
          style={{
            '--ptero-top': `${p.topVh}svh`,
            '--ptero-size': `${p.sizePx}px`,
            '--ptero-speed': `${p.speedSeconds}s`,
            '--ptero-delay': `${p.delaySeconds}s`,
          }}
        >
          <img
            src={
              p.direction === 'left'
                ? '/pterodactyl-left-flapping.svg'
                : '/pterodactyl-right-flapping.svg'
            }
            alt=""
            draggable={false}
            className={`pterodactyl-sprite${p.dead ? ' is-dead' : ''}`}
          />
        </div>
      ))}
    </div>
  );
}

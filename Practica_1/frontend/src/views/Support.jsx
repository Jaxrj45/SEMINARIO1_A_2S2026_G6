import { UserIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

const team = [
  {
    name: 'Derek Francisco Orellana Ibáñez',
    github: 'D3r3-k',
    url: 'https://github.com/D3r3-k'
  },
  {
    name: 'Jose Adrian Orozco Ramirez',
    github: 'JoseAdrianOrozcoRamirez',
    url: 'https://github.com/JoseAdrianOrozcoRamirez'
  },
  {
    name: 'Miguel Angel Kanek Balan Velasco',
    github: 'Miguel-B765',
    url: 'https://github.com/Miguel-B765'
  },
  {
    name: 'Edwin Alexander Jax Lopez',
    github: 'Jaxrj45',
    url: 'https://github.com/Jaxrj45'
  }
];

export default function Support() {
  return (
    <div className="bg-cinema-base min-h-screen py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-semibold leading-7 text-cinema-primary">Seminario de Sistemas 1</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Equipo de Soporte y Desarrollo
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-300">
            Conoce a los ingenieros detrás de CloudCinema. Puedes revisar nuestro trabajo y contribuciones directamente en nuestros perfiles de GitHub.
          </p>
        </div>
        
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-4">
            {team.map((member) => (
              <div key={member.github} className="flex flex-col items-center text-center bg-cinema-panel p-8 rounded-2xl border border-gray-700 shadow-lg hover:border-cinema-primary/50 transition-colors">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gray-800 ring-1 ring-white/10">
                  <UserIcon className="h-8 w-8 text-cinema-primary" aria-hidden="true" />
                </div>
                <dt className="text-lg font-semibold leading-7 text-white mb-2">
                  {member.name}
                </dt>
                <dd className="mt-auto flex flex-col items-center">
                  <p className="text-sm leading-6 text-gray-400 mb-4">
                    Desarrollador Full Stack
                  </p>
                  <a
                    href={member.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-semibold leading-6 text-cinema-primary hover:text-cinema-primary-hover transition-colors"
                  >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                    </svg>
                    @{member.github}
                  </a>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}

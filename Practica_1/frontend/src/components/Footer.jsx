export default function Footer() {
  return (
    <footer className="bg-[#0b0f19] border-t border-gray-800 text-gray-400 py-10 mt-auto">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 flex flex-col items-center">
        
        <h3 className="text-xl font-bold text-white mb-2">CloudCinema</h3>
        <p className="text-sm mb-6 text-center max-w-md">
          Proyecto desarrollado para el curso de Seminario de Sistemas 1. 
          Implementación de servicios en la nube, balanceo de carga y almacenamiento S3.
        </p>

        <div className="flex flex-wrap justify-center gap-6 text-sm mb-8">
          <a href="#" className="hover:text-cinema-primary transition-colors">Términos de Servicio</a>
          <a href="#" className="hover:text-cinema-primary transition-colors">Política de Privacidad</a>
          <a href="#" className="hover:text-cinema-primary transition-colors">Centro de Ayuda</a>
          <a href="#" className="hover:text-cinema-primary transition-colors">Contacto</a>
        </div>
        
        <div className="w-full border-t border-gray-800 mb-6"></div>

        <div className="flex flex-col sm:flex-row justify-between w-full text-xs text-gray-500">
          <p>&copy; 2026 CloudCinema. Universidad de San Carlos de Guatemala.</p>
          <p className="mt-2 sm:mt-0">Grupo 6 - Sección A</p>
        </div>
      </div>
    </footer>
  );
}

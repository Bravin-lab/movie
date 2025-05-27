import { FaLinkedin, FaTwitter, FaFacebook, FaInstagram, FaWhatsapp, FaGoogle, FaGithub, FaTelegram, FaPhone } from 'react-icons/fa';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-2 mt-0">
      <div className="container mx-auto px-4 text-center">
        <h3 className="text-xl font-bold mb-1">
          <span className="text-red-600">BRA</span>
          <span className="text-white">VIN</span>
        </h3>
        <p className="mb-2 text-sm">Empowering Innovation. Driving Transformation.</p>
        <div className="flex justify-center space-x-4 mb-2 text-xl">
          <a href="#" aria-label="LinkedIn" className="hover:text-red-600"><FaLinkedin /></a>
          <a href="#" aria-label="Twitter" className="hover:text-red-600"><FaTwitter /></a>
          <a href="https://www.facebook.com/brave.light.963" aria-label="Facebook" className="hover:text-red-600"><FaFacebook /></a>
          <a href="https://www.instagram.com/top_thrille.r/" aria-label="Instagram" className="hover:text-red-600"><FaInstagram /></a>
          <a href="https://wa.me/+254701912357" aria-label="WhatsApp" className="hover:text-red-600"><FaWhatsapp /></a>
          <a href="#" aria-label="Google" className="hover:text-red-600"><FaGoogle /></a>
          <a href="https://github.com/Bravin-lab" aria-label="GitHub" className="hover:text-red-600"><FaGithub /></a>
          <a href="https://t.me/Bravi_n" aria-label="Telegram" className="hover:text-red-600"><FaTelegram /></a>
        </div>
        <p className="text-sm">Email: <a href="mailto:techsavvy@bravin.store" className="underline hover:text-red-600">techsavvy@bravin.store</a></p>
        <p className="flex items-center justify-center space-x-2 mt-1 text-sm">
          <FaPhone />
          <span>+254701912357</span>
        </p>
      </div>
      <div className="bg-gray-800 mt-4 py-2">
        <p className="text-center text-xs">
          copyright &copy; 2025 Techlords. created and maintained by <span className="text-red-600">Bravin.</span>
        </p>
      </div>
    </footer>
  );
}

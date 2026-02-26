import Link from "next/link";

const Navbar = () => {
  return (
    <nav className="flex items-center justify-between px-8 md:px-16 py-6 bg-brandGreen">
      {/* Logo */}
      <div className="text-2xl font-bold text-white">
        Barang<span className="text-accentGreen">AI</span>
      </div>

      {/* Links */}
      <ul className="hidden md:flex items-center gap-8 text-sm text-white">
        <li><Link href="#">Home</Link></li>
        <li><Link href="#">Tutorials</Link></li>
        <li><Link href="#">About us</Link></li>
        <li><Link href="#">Register</Link></li>
      </ul>

      {/* Button */}
      <button className="bg-accentGreen text-black font-semibold px-5 py-2 rounded-full hover:opacity-90 transition">
        Contact us
      </button>
    </nav>
  );
};

export default Navbar;
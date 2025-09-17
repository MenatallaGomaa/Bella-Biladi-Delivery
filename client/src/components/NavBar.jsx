export default function NavBar() {
  return (
    <nav className="h-12 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <img
          src="/logo.png"
          alt="BellaBiladi"
          className="h-8 w-8 rounded-full border"
        />
        <a
          className="text-sm font-medium px-2 py-1 rounded bg-amber-200/60"
          href="#"
        >
          Home
        </a>
        <a className="text-sm px-2 py-1" href="#">
          Cart
        </a>
        <a className="text-sm px-2 py-1" href="#">
          Checkout
        </a>
        <a className="text-sm px-2 py-1" href="#">
          Contact
        </a>
        <a className="text-sm px-2 py-1" href="#">
          Catering
        </a>
      </div>
      <div className="flex items-center gap-2">
        <button className="text-xs border rounded px-2 py-1">Sign in</button>
        <button className="text-xs bg-slate-900 text-white rounded px-2 py-1">
          Register
        </button>
      </div>
    </nav>
  );
}

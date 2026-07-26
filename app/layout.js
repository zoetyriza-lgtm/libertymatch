import "./globals.css";
import Navbar from "../components/Navbar";

export const metadata = {
  title: "LibertyMatch",
  description: "Encuentra con quién hacer tu próxima actividad en el campus",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className="font-body min-h-screen">
        <Navbar />
        <main className="max-w-3xl mx-auto px-4 py-10 page-enter">{children}</main>
      </body>
    </html>
  );
}

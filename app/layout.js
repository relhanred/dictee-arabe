import "./globals.css";
import {AuthProvider} from "@/contexts/AuthContext";

export const metadata = {
    title: "Imlaa",
    description: "Entraînez-vous à la dictée en arabe en choisissant les lettres que vous avez apprises. Pratiquez avec des phrases correspondant à votre niveau. Ajustez la difficulté des dictées pour un défi supplémentaire.",
};

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AuthProvider className="antialiased">{children}</AuthProvider>
      </body>
    </html>
  );
}

import "./globals.css";
import {AuthProvider} from "@/contexts/AuthContext";
import AppLayout from "@/app/layout/AppLayout";

export const metadata = {
    title: "Imlaa",
    description: "Entraînez-vous à la dictée en arabe en choisissant les lettres que vous avez apprises. Pratiquez avec des phrases correspondant à votre niveau. Ajustez la difficulté des dictées pour un défi supplémentaire.",
};

export default function RootLayout({children}) {
    return (
        <html>
        <body className="antialiased h-screen w-screen flex flex-col flex-1 overflow-x-hidden">
        <AppLayout>
            <AuthProvider className="">
                {children}
            </AuthProvider>
        </AppLayout>
        </body>
        </html>
    );
}

import "./globals.css";
import {AuthProvider} from "@/contexts/AuthContext";
import {
    Montserrat,
    Noto_Sans_Arabic
} from "next/font/google";


const noto = Noto_Sans_Arabic({
    weight: ['400', '500', '600', '700',],
    subsets: ['arabic'],
    display: 'swap',
    variable: '--font-noto'
})

const montserrat = Montserrat({
    variable: '--font-montserrat',
    subsets: ['latin'],
})

export const metadata = {
    title: "Imlaa",
    description: "Entraînez-vous à la dictée en arabe en choisissant les lettres que vous avez apprises. Pratiquez avec des phrases correspondant à votre niveau. Ajustez la difficulté des dictées pour un défi supplémentaire.",
};

export default function RootLayout({children}) {
    return (
        <html>
        <body className={`${noto.variable} ${montserrat.variable} antialiased min-h-screen w-screen flex flex-col flex-1 overflow-x-hidden font-montserrat`}>
        <AuthProvider>
            {children}
        </AuthProvider>
        </body>
        </html>
    );
}

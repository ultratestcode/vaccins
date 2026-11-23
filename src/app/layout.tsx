import type { Metadata } from "next";
import Script from "next/script";
import { Archivo, Geist_Mono } from "next/font/google";
import { Button } from "@/components/ui/button";
import "./globals.css";

// Bascule de thème sans état React : un bouton HTML natif + ce script.
// - Avant le rendu : applique la préférence (localStorage gagne, sinon le
//   système : zéro flash). Injecté via next/script strategy
//   « beforeInteractive », le mécanisme officiel — un <script> nu dans un
//   composant React est ignoré au rendu client.
// - Au clic : délègue sur [data-theme-toggle]. Le libellé du bouton est
//   changé par CSS pur (deux spans, variante .dark) : le script ne touche
//   jamais au texte, sinon il diverge du HTML hydraté par React.
const themeScript = `(function(){
var stored=null;try{stored=localStorage.getItem("vaccins-theme")}catch(e){}
var dark=stored==="dark"||(!stored&&window.matchMedia("(prefers-color-scheme: dark)").matches);
document.documentElement.classList.toggle("dark",dark);
document.addEventListener("click",function(e){
var b=e.target&&e.target.closest?e.target.closest("[data-theme-toggle]"):null;
if(!b)return;
var next=!document.documentElement.classList.contains("dark");
document.documentElement.classList.toggle("dark",next);
try{localStorage.setItem("vaccins-theme",next?"dark":"light")}catch(e){}
});
})();`;

// Design system « Comptoir » (hérité de pipeline) : grotesque Archivo.
const archivo = Archivo({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vaccins — calendrier français",
  description:
    "Check vaccinal selon le calendrier français : prochains vaccins, rappels, obligatoire ou recommandé.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning sur <html> : motif officiel Next (guide dark
    // mode). Le script beforeInteractive ajoute la classe « dark » avant
    // l'hydratation ; React verrait un attribut différent du sien et leverait
    // un avertissement. Seul cet élément est dispensé, rien d'autre.
    <html
      lang="fr"
      suppressHydrationWarning
      className={`${archivo.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Script id="vaccins-theme" strategy="beforeInteractive">
          {themeScript}
        </Script>
        <div className="fixed right-6 top-6 z-50">
          {/* Button shadcn (outline) : le script délègue toujours les clics
              sur [data-theme-toggle] ; libellé rendu par CSS seul (« Mode
              sombre » en clair, « Mode clair » en sombre). */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            data-theme-toggle
          >
            <span className="dark:hidden">Mode sombre</span>
            <span className="hidden dark:inline">Mode clair</span>
          </Button>
        </div>
        {children}
      </body>
    </html>
  );
}

// Exemplo de como usar Lottie animation nas categorias
import heartAnimation from "@/assets/lottie/heart-animation.json";
import { IconData } from "@/components/CategoryIcon";

// Exemplo de configuração de categoria com Lottie
export const namoroComLottie: IconData = {
  type: 'lottie',
  content: heartAnimation
};

// Para usar, substitua no categories.ts:
// {
//   id: "namoro",
//   name: "Namoro",
//   icon: namoroComLottie,
//   color: "from-pink-500 to-rose-500",
//   description: "Encontre seu par perfeito"
// }
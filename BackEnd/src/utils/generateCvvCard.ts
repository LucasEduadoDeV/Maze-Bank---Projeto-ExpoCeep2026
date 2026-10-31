export function gerarCvv(): string {
    
  const numeroAleatorio = Math.floor(100 + Math.random() * 900);
  return numeroAleatorio.toString();
}
export function generateValidateCard(): Date {
  const dataValidade = new Date();
  dataValidade.setFullYear(dataValidade.getFullYear() + 5);
  return dataValidade;
}

export function formatarValidade(data: Date): string {
  return data.toLocaleDateString('pt-BR', {
    month: '2-digit',
    year: '2-digit',
  });
}

// --- Exemplo de Uso ---
//const dataBanco = gerarValidadeCartao(); // Salva isso no Prisma
//const dataTela = formatarValidade(dataBanco); // Mostra isso no HTML ("10/31")
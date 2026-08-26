const fs = require("fs");
const { cert, initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");

async function main() {
  const email = process.argv[2];
  const caminhoChave = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (!email) {
    console.error("Informe o e-mail do administrador.");
    process.exit(1);
  }

  if (!caminhoChave) {
    console.error("GOOGLE_APPLICATION_CREDENTIALS não está configurado.");
    process.exit(1);
  }

  if (!fs.existsSync(caminhoChave)) {
    console.error("Arquivo da chave não encontrado em:");
    console.error(caminhoChave);
    process.exit(1);
  }

  const serviceAccount = JSON.parse(
    fs.readFileSync(caminhoChave, "utf8")
  );

  initializeApp({
    credential: cert(serviceAccount),
    projectId: "angel-transports-e60c5",
  });

  const auth = getAuth();

  const user = await auth.getUserByEmail(email);

  await auth.setCustomUserClaims(user.uid, {
    ...(user.customClaims || {}),
    admin: true,
  });

  console.log(`ADM ativado com sucesso: ${email}`);
  console.log("Saia do site e entre novamente.");
}

main().catch((error) => {
  console.error("Erro ao ativar ADM:", error);
  process.exit(1);
});
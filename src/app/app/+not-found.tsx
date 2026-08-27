import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const VINHO = "#69172D";
const VINHO_ESCURO = "#370913";
const FUNDO = "#F6F1F3";

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.codigo}>404</Text>
      <Text style={styles.titulo}>Página não encontrada</Text>
      <Text style={styles.texto}>
        O endereço acessado não existe ou foi alterado.
      </Text>

      <TouchableOpacity
        style={styles.botao}
        onPress={() => router.replace("/")}
        accessibilityRole="button"
        accessibilityLabel="Voltar para a página inicial"
      >
        <Text style={styles.botaoTexto}>Voltar para o início</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: FUNDO,
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
  },
  codigo: {
    color: VINHO,
    fontSize: 72,
    fontWeight: "900",
  },
  titulo: {
    color: VINHO_ESCURO,
    fontSize: 28,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 6,
  },
  texto: {
    color: "#766A6E",
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    marginTop: 12,
    marginBottom: 26,
  },
  botao: {
    backgroundColor: VINHO,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  botaoTexto: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },
});

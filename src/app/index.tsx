import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";

import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";

import { auth, db } from "../firebase/config";

// =====================================================
// CONFIGURAÇÕES
// =====================================================

const EMAIL_ADMIN = "brunotmuller08@gmail.com";

const VINHO = "#69172D";
const VINHO_ESCURO = "#370913";
const VINHO_CLARO = "#8D2945";
const FUNDO = "#F6F1F3";
const BRANCO = "#FFFFFF";
const VERDE = "#248A46";
const VERMELHO = "#B83A48";
const AMARELO = "#B7791F";

// =====================================================
// TIPOS
// =====================================================

type Tela =
  | "inicio"
  | "menu"
  | "cadastro"
  | "perfil"
  | "avisosUsuario"
  | "sucesso"
  | "admin";

type RotaAdmin =
  | "dashboard"
  | "alunos"
  | "pagamentos"
  | "calendario"
  | "rotas"
  | "van"
  | "avisos"
  | "configuracoes";

type StatusPagamento = "pago" | "nao_pago";

type Aluno = {
  id: string;
  nomeAluno?: string;
  nomeResponsavel?: string;
  telefone?: string;
  bairro?: string;
  escola?: string;
  turno?: string;
  usuarioEmail?: string;
  usuarioUid?: string;
};

type Pagamento = {
  id: string;
  alunoId: string;
  nomeAluno: string;
  status: StatusPagamento;
  mes: number;
  ano: number;
  dataPagamento?: any;
  dataVencimento?: string;
  valor?: number;
  observacao?: string;
};

type Rota = {
  id: string;
  nome: string;
  bairros: string;
  escolas: string;
  horario: string;
  observacoes?: string;
};

type Aviso = {
  id: string;
  titulo: string;
  mensagem: string;
  criadoEm?: any;
};

type Van = {
  modelo: string;
  ano: string;
  placa: string;
  capacidade: string;
  observacoes: string;
};

type Configuracoes = {
  escolas: string[];
  bairros: string[];
  valorMensalPadrao: string;
};

// =====================================================
// APP PRINCIPAL
// =====================================================

export default function HomeScreen() {
  const [tela, setTela] = useState<Tela>("inicio");
  const [modo, setModo] = useState<"login" | "criar">("login");

  // ADMIN vem antes das animações
  const [rotaAdmin, setRotaAdmin] = useState<RotaAdmin>("dashboard");
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [carregandoAlunos, setCarregandoAlunos] = useState(false);

  // ANIMAÇÕES
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const logoAnim = useRef(new Animated.Value(0)).current;
  const brilhoAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fadeAnim.setValue(0.85);
    slideAnim.setValue(18);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [tela, rotaAdmin]);

  useEffect(() => {
    const logoLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(logoAnim, {
          toValue: -7,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(logoAnim, {
          toValue: 0,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    const brilhoLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(brilhoAnim, {
          toValue: 1,
          duration: 2200,
          useNativeDriver: true,
        }),
        Animated.timing(brilhoAnim, {
          toValue: 0,
          duration: 2200,
          useNativeDriver: true,
        }),
      ])
    );

    logoLoop.start();
    brilhoLoop.start();

    return () => {
      logoLoop.stop();
      brilhoLoop.stop();
    };
  }, []);

  // CONTA
  const [nomeUsuario, setNomeUsuario] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [carregando, setCarregando] = useState(false);

  // CADASTRO DO ALUNO
  const [nomeAluno, setNomeAluno] = useState("");
  const [nomeResponsavel, setNomeResponsavel] = useState("");
  const [telefone, setTelefone] = useState("");
  const [bairro, setBairro] = useState("");
  const [escola, setEscola] = useState("");
  const [turno, setTurno] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [cadastroId, setCadastroId] = useState("");

  // PERFIL
  const [meusAlunos, setMeusAlunos] = useState<Aluno[]>([]);
  const [carregandoPerfil, setCarregandoPerfil] = useState(false);

  // PAGAMENTOS
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [carregandoPagamentos, setCarregandoPagamentos] = useState(false);
  const [mesSelecionado, setMesSelecionado] = useState(new Date());

  const mesAtual = mesSelecionado.getMonth() + 1;
  const anoAtual = mesSelecionado.getFullYear();

  // ROTAS
  const [rotas, setRotas] = useState<Rota[]>([]);
  const [nomeRota, setNomeRota] = useState("");
  const [bairrosRota, setBairrosRota] = useState("");
  const [escolasRota, setEscolasRota] = useState("");
  const [horarioRota, setHorarioRota] = useState("");
  const [observacoesRota, setObservacoesRota] = useState("");

  // VAN
  const [van, setVan] = useState<Van>({
    modelo: "",
    ano: "",
    placa: "",
    capacidade: "",
    observacoes: "",
  });

  // AVISOS
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [tituloAviso, setTituloAviso] = useState("");
  const [mensagemAviso, setMensagemAviso] = useState("");

  // CONFIG
  const [config, setConfig] = useState<Configuracoes>({
    escolas: [],
    bairros: [],
    valorMensalPadrao: "",
  });
  const [novaEscola, setNovaEscola] = useState("");
  const [novoBairro, setNovoBairro] = useState("");

  // BUSCA
  const [buscaAluno, setBuscaAluno] = useState("");

  // =====================================================
  // LOGIN E CONTA
  // =====================================================

  async function fazerLogin() {
    if (!email.trim() || !senha.trim()) {
      Alert.alert("Atenção", "Preencha o e-mail e a senha.");
      return;
    }

    try {
      setCarregando(true);

      const credencial = await signInWithEmailAndPassword(
        auth,
        email.trim().toLowerCase(),
        senha
      );

      const emailLogado = credencial.user.email?.toLowerCase().trim();

      if (emailLogado === EMAIL_ADMIN) {
        setRotaAdmin("dashboard");
        setTela("admin");
        return;
      }

      setTela("menu");
    } catch (error: any) {
      let mensagem = "Não foi possível entrar.";

      if (
        error.code === "auth/invalid-credential" ||
        error.code === "auth/user-not-found" ||
        error.code === "auth/wrong-password"
      ) {
        mensagem = "E-mail ou senha incorretos.";
      } else if (error.code === "auth/invalid-email") {
        mensagem = "Digite um e-mail válido.";
      }

      Alert.alert("Erro no login", mensagem);
    } finally {
      setCarregando(false);
    }
  }

  async function criarConta() {
    if (
      !nomeUsuario.trim() ||
      !email.trim() ||
      !senha.trim() ||
      !confirmarSenha.trim()
    ) {
      Alert.alert("Atenção", "Preencha todos os campos.");
      return;
    }

    if (senha.length < 6) {
      Alert.alert("Senha inválida", "A senha precisa ter pelo menos 6 caracteres.");
      return;
    }

    if (senha !== confirmarSenha) {
      Alert.alert("Atenção", "As senhas não são iguais.");
      return;
    }

    try {
      setCarregando(true);

      const credencial = await createUserWithEmailAndPassword(
        auth,
        email.trim().toLowerCase(),
        senha
      );

      await setDoc(doc(db, "users", credencial.user.uid), {
        name: nomeUsuario.trim(),
        email: credencial.user.email,
        role: "responsavel",
        criadoEm: serverTimestamp(),
      });

      setSenha("");
      setConfirmarSenha("");

      Alert.alert("Conta registrada!", "Sua conta foi criada com sucesso.");
      setTela("cadastro");
    } catch (error: any) {
      let mensagem = "Não foi possível criar a conta.";

      if (error.code === "auth/email-already-in-use") {
        mensagem = "Esse e-mail já possui uma conta.";
      } else if (error.code === "auth/invalid-email") {
        mensagem = "Digite um e-mail válido.";
      }

      Alert.alert("Erro", mensagem);
    } finally {
      setCarregando(false);
    }
  }

  async function sair() {
    await signOut(auth);

    setEmail("");
    setSenha("");
    setNomeUsuario("");
    setConfirmarSenha("");
    limparCadastro();

    setTela("inicio");
    setModo("login");
  }

  // =====================================================
  // ALUNOS
  // =====================================================

  async function cadastrarAluno() {
    if (
      !nomeAluno.trim() ||
      !nomeResponsavel.trim() ||
      !telefone.trim() ||
      !bairro.trim() ||
      !escola.trim() ||
      !turno.trim()
    ) {
      Alert.alert("Atenção", "Preencha todos os campos.");
      return;
    }

    try {
      setSalvando(true);

      const usuario = auth.currentUser;

      if (!usuario) {
        setTela("inicio");
        return;
      }

      const documento = await addDoc(collection(db, "alunos"), {
        nomeAluno: nomeAluno.trim(),
        nomeResponsavel: nomeResponsavel.trim(),
        telefone: telefone.trim(),
        bairro: bairro.trim(),
        escola: escola.trim(),
        turno: turno.trim(),
        usuarioUid: usuario.uid,
        usuarioEmail: usuario.email || "",
        criadoEm: serverTimestamp(),
      });

      setCadastroId(documento.id);
      setTela("sucesso");
    } catch (error) {
      console.log(error);
      Alert.alert("Erro", "Não foi possível cadastrar a criança.");
    } finally {
      setSalvando(false);
    }
  }

  async function buscarMeusAlunos() {
    try {
      setCarregandoPerfil(true);

      const usuario = auth.currentUser;
      if (!usuario) return;

      const consulta = query(
        collection(db, "alunos"),
        where("usuarioUid", "==", usuario.uid)
      );

      const resposta = await getDocs(consulta);

      setMeusAlunos(
        resposta.docs.map((item) => ({
          id: item.id,
          ...(item.data() as Omit<Aluno, "id">),
        }))
      );
    } finally {
      setCarregandoPerfil(false);
    }
  }

  async function buscarAlunos() {
    try {
      setCarregandoAlunos(true);

      const resposta = await getDocs(collection(db, "alunos"));

      setAlunos(
        resposta.docs.map((item) => ({
          id: item.id,
          ...(item.data() as Omit<Aluno, "id">),
        }))
      );
    } catch (error) {
      console.log("ERRO ALUNOS", error);
    } finally {
      setCarregandoAlunos(false);
    }
  }

  function limparCadastro() {
    setNomeAluno("");
    setNomeResponsavel("");
    setTelefone("");
    setBairro("");
    setEscola("");
    setTurno("");
    setCadastroId("");
  }

  // =====================================================
  // PAGAMENTOS
  // =====================================================

  async function buscarPagamentos() {
    try {
      setCarregandoPagamentos(true);

      const consulta = query(
        collection(db, "pagamentos"),
        where("mes", "==", mesAtual),
        where("ano", "==", anoAtual)
      );

      const resposta = await getDocs(consulta);

      setPagamentos(
        resposta.docs.map((item) => ({
          id: item.id,
          ...(item.data() as Omit<Pagamento, "id">),
        }))
      );
    } catch (error) {
      console.log("ERRO PAGAMENTOS", error);
    } finally {
      setCarregandoPagamentos(false);
    }
  }

  async function alterarPagamento(
    aluno: Aluno,
    status: StatusPagamento,
    valor?: number,
    observacao?: string
  ) {
    try {
      const idPagamento = `${aluno.id}_${anoAtual}_${mesAtual}`;

      await setDoc(
        doc(db, "pagamentos", idPagamento),
        {
          alunoId: aluno.id,
          nomeAluno: aluno.nomeAluno || "",
          status,
          mes: mesAtual,
          ano: anoAtual,
          valor: valor ?? Number(config.valorMensalPadrao || 0),
          observacao: observacao || "",
          dataPagamento: status === "pago" ? serverTimestamp() : null,
          atualizadoEm: serverTimestamp(),
        },
        { merge: true }
      );

      await registrarLog(
        "Pagamento alterado",
        `${aluno.nomeAluno}: ${status === "pago" ? "Pago" : "Não pago"}`
      );

      await buscarPagamentos();
    } catch (error) {
      console.log(error);
      Alert.alert("Erro", "Não foi possível atualizar o pagamento.");
    }
  }

  async function salvarDataVencimento(
    aluno: Aluno,
    dataVencimento: string,
    valor?: number,
    observacao?: string
  ) {
    if (!dataVencimento.trim()) {
      Alert.alert("Atenção", "Digite a data de vencimento.");
      return;
    }

    try {
      const idPagamento = `${aluno.id}_${anoAtual}_${mesAtual}`;
      const existente = pagamentos.find((p) => p.alunoId === aluno.id);

      await setDoc(
        doc(db, "pagamentos", idPagamento),
        {
          alunoId: aluno.id,
          nomeAluno: aluno.nomeAluno || "",
          status: existente?.status || "nao_pago",
          mes: mesAtual,
          ano: anoAtual,
          dataVencimento: dataVencimento.trim(),
          valor: valor ?? existente?.valor ?? Number(config.valorMensalPadrao || 0),
          observacao: observacao ?? existente?.observacao ?? "",
          atualizadoEm: serverTimestamp(),
        },
        { merge: true }
      );

      await registrarLog(
        "Vencimento alterado",
        `${aluno.nomeAluno}: ${dataVencimento}`
      );

      await buscarPagamentos();
      Alert.alert("Salvo", "Dados financeiros atualizados.");
    } catch {
      Alert.alert("Erro", "Não foi possível salvar os dados.");
    }
  }

  // =====================================================
  // ROTAS
  // =====================================================

  async function buscarRotas() {
    const resposta = await getDocs(collection(db, "rotas"));

    setRotas(
      resposta.docs.map((item) => ({
        id: item.id,
        ...(item.data() as Omit<Rota, "id">),
      }))
    );
  }

  async function criarRota() {
    if (!nomeRota.trim() || !bairrosRota.trim() || !escolasRota.trim()) {
      Alert.alert("Atenção", "Preencha nome, bairros e escolas.");
      return;
    }

    await addDoc(collection(db, "rotas"), {
      nome: nomeRota.trim(),
      bairros: bairrosRota.trim(),
      escolas: escolasRota.trim(),
      horario: horarioRota.trim(),
      observacoes: observacoesRota.trim(),
      criadoEm: serverTimestamp(),
    });

    await registrarLog("Rota criada", nomeRota.trim());

    setNomeRota("");
    setBairrosRota("");
    setEscolasRota("");
    setHorarioRota("");
    setObservacoesRota("");

    await buscarRotas();
  }

  // =====================================================
  // VAN
  // =====================================================

  async function buscarVan() {
    const snap = await getDoc(doc(db, "configuracoes", "van"));

    if (snap.exists()) {
      setVan(snap.data() as Van);
    }
  }

  async function salvarVan() {
    await setDoc(
      doc(db, "configuracoes", "van"),
      {
        ...van,
        atualizadoEm: serverTimestamp(),
      },
      { merge: true }
    );

    await registrarLog("Dados da van atualizados", van.modelo);
    Alert.alert("Salvo", "Dados da van atualizados.");
  }

  // =====================================================
  // AVISOS
  // =====================================================

  async function buscarAvisos() {
    const resposta = await getDocs(collection(db, "avisos"));

    const lista = resposta.docs.map((item) => ({
      id: item.id,
      ...(item.data() as Omit<Aviso, "id">),
    }));

    setAvisos(lista.reverse());
  }

  async function criarAviso() {
    if (!tituloAviso.trim() || !mensagemAviso.trim()) {
      Alert.alert("Atenção", "Digite o título e a mensagem.");
      return;
    }

    await addDoc(collection(db, "avisos"), {
      titulo: tituloAviso.trim(),
      mensagem: mensagemAviso.trim(),
      criadoEm: serverTimestamp(),
    });

    await registrarLog("Aviso criado", tituloAviso.trim());

    setTituloAviso("");
    setMensagemAviso("");

    await buscarAvisos();
  }

  // =====================================================
  // CONFIGURAÇÕES
  // =====================================================

  async function buscarConfiguracoes() {
    const snap = await getDoc(doc(db, "configuracoes", "geral"));

    if (snap.exists()) {
      const dados = snap.data();

      setConfig({
        escolas: dados.escolas || [],
        bairros: dados.bairros || [],
        valorMensalPadrao: dados.valorMensalPadrao || "",
      });
    }
  }

  async function salvarConfiguracoes(novoConfig: Configuracoes) {
    setConfig(novoConfig);

    await setDoc(
      doc(db, "configuracoes", "geral"),
      {
        ...novoConfig,
        atualizadoEm: serverTimestamp(),
      },
      { merge: true }
    );
  }

  async function adicionarEscola() {
    if (!novaEscola.trim()) return;

    const novo = {
      ...config,
      escolas: [...config.escolas, novaEscola.trim()],
    };

    setNovaEscola("");
    await salvarConfiguracoes(novo);
  }

  async function adicionarBairro() {
    if (!novoBairro.trim()) return;

    const novo = {
      ...config,
      bairros: [...config.bairros, novoBairro.trim()],
    };

    setNovoBairro("");
    await salvarConfiguracoes(novo);
  }

  // =====================================================
  // LOG / AUDITORIA
  // =====================================================

  async function registrarLog(acao: string, detalhes: string) {
    try {
      await addDoc(collection(db, "logs"), {
        acao,
        detalhes,
        adminEmail: auth.currentUser?.email || "",
        criadoEm: serverTimestamp(),
      });
    } catch {}
  }

  // =====================================================
  // EXPORTAÇÃO CSV
  // =====================================================

  function baixarCSV(nomeArquivo: string, linhas: string[][]) {
    if (Platform.OS !== "web") {
      Alert.alert(
        "Exportação",
        "A exportação CSV está disponível na versão web."
      );
      return;
    }

    const csv = linhas
      .map((linha) =>
        linha.map((item) => `"${String(item ?? "").replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

    const g: any = globalThis as any;
    const blob = new g.Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = g.URL.createObjectURL(blob);
    const a = g.document.createElement("a");

    a.href = url;
    a.download = nomeArquivo;
    a.click();

    g.URL.revokeObjectURL(url);
  }

  function exportarAlunos() {
    baixarCSV("alunos-angel-transports.csv", [
      ["Nome", "Responsável", "Telefone", "Bairro", "Escola", "Turno", "E-mail"],
      ...alunos.map((a) => [
        a.nomeAluno || "",
        a.nomeResponsavel || "",
        a.telefone || "",
        a.bairro || "",
        a.escola || "",
        a.turno || "",
        a.usuarioEmail || "",
      ]),
    ]);
  }

  function exportarPagamentos() {
    baixarCSV(`pagamentos-${mesAtual}-${anoAtual}.csv`, [
      ["Aluno", "Status", "Vencimento", "Valor", "Observação"],
      ...alunos.map((aluno) => {
        const p = pagamentos.find((item) => item.alunoId === aluno.id);

        return [
          aluno.nomeAluno || "",
          p?.status === "pago" ? "Pago" : "Não pago",
          p?.dataVencimento || "",
          String(p?.valor || ""),
          p?.observacao || "",
        ];
      }),
    ]);
  }

  // =====================================================
  // EFEITOS
  // =====================================================

  useEffect(() => {
    if (tela === "perfil") {
      buscarMeusAlunos();
      buscarAvisos();
    }

    if (tela === "avisosUsuario") {
      buscarAvisos();
    }

    if (tela === "admin") {
      buscarAlunos();
      buscarConfiguracoes();
      buscarAvisos();
      buscarVan();
      buscarRotas();
    }
  }, [tela]);

  useEffect(() => {
    if (
      tela === "admin" &&
      (rotaAdmin === "dashboard" ||
        rotaAdmin === "pagamentos" ||
        rotaAdmin === "calendario")
    ) {
      buscarPagamentos();
    }
  }, [tela, rotaAdmin, mesAtual, anoAtual]);

  // =====================================================
  // DADOS CALCULADOS
  // =====================================================

  const alunosFiltrados = useMemo(() => {
    const busca = buscaAluno.trim().toLowerCase();

    if (!busca) return alunos;

    return alunos.filter((a) =>
      `${a.nomeAluno} ${a.nomeResponsavel} ${a.escola} ${a.bairro}`
        .toLowerCase()
        .includes(busca)
    );
  }, [alunos, buscaAluno]);

  const totalPago = pagamentos.filter((p) => p.status === "pago").length;
  const totalPendente = Math.max(alunos.length - totalPago, 0);
  const totalRecebido = pagamentos
    .filter((p) => p.status === "pago")
    .reduce((soma, p) => soma + Number(p.valor || 0), 0);

  const vencendo = alunos.filter((aluno) => {
    const p = pagamentos.find((item) => item.alunoId === aluno.id);
    return p?.status !== "pago" && estaVencendoEmSeteDias(p?.dataVencimento);
  }).length;

  // =====================================================
  // TELA INICIAL
  // =====================================================

  if (tela === "inicio") {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.hero}>
            <Animated.View
              style={[
                styles.bolhaGrande,
                {
                  opacity: brilhoAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.15, 0.4],
                  }),
                },
              ]}
            />

            <Animated.View
              style={[
                styles.bolhaPequena,
                {
                  opacity: brilhoAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.08, 0.3],
                  }),
                },
              ]}
            />

            <Animated.View
              style={[
                styles.logoImagemContainer,
                {
                  transform: [{ translateY: logoAnim }],
                },
              ]}
            >
              <Image
                source={require("../../assets/images/logo-at.png")}
                style={styles.logoImagem}
                resizeMode="contain"
              />
            </Animated.View>

            <Text style={styles.title}>Angel Transports</Text>

            <Text style={styles.subtitle}>
              Transporte escolar com segurança, organização e transparência
            </Text>
          </View>

          <Animated.View
            style={[
              styles.main,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.card}>
              <Text style={styles.tag}>ACESSO AO SISTEMA</Text>

              <Text style={styles.cardTitle}>
                {modo === "login" ? "Bem-vindo" : "Criar conta"}
              </Text>

              <Text style={styles.descricao}>
                {modo === "login"
                  ? "Entre com sua conta para acessar o sistema."
                  : "Crie sua conta e cadastre sua criança."}
              </Text>

              <View style={styles.tabs}>
                <TouchableOpacity
                  style={[styles.tab, modo === "login" && styles.tabAtiva]}
                  onPress={() => setModo("login")}
                >
                  <Text
                    style={[
                      styles.tabText,
                      modo === "login" && styles.tabTextAtiva,
                    ]}
                  >
                    Entrar
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.tab, modo === "criar" && styles.tabAtiva]}
                  onPress={() => setModo("criar")}
                >
                  <Text
                    style={[
                      styles.tabText,
                      modo === "criar" && styles.tabTextAtiva,
                    ]}
                  >
                    Criar conta
                  </Text>
                </TouchableOpacity>
              </View>

              {modo === "criar" && (
                <Campo
                  label="Nome"
                  value={nomeUsuario}
                  onChange={setNomeUsuario}
                  placeholder="Digite seu nome"
                />
              )}

              <Campo
                label="E-mail"
                value={email}
                onChange={setEmail}
                placeholder="Digite seu e-mail"
                email
              />

              <Text style={styles.label}>Senha</Text>

              <TextInput
                style={styles.input}
                value={senha}
                onChangeText={setSenha}
                placeholder="Digite sua senha"
                placeholderTextColor="#9C8F92"
                secureTextEntry
              />

              {modo === "criar" && (
                <>
                  <Text style={styles.label}>Confirmar senha</Text>

                  <TextInput
                    style={styles.input}
                    value={confirmarSenha}
                    onChangeText={setConfirmarSenha}
                    placeholder="Digite novamente"
                    placeholderTextColor="#9C8F92"
                    secureTextEntry
                  />
                </>
              )}

              <BotaoAnimado
                texto={
                  modo === "login" ? "Entrar no sistema" : "Criar minha conta"
                }
                carregando={carregando}
                onPress={modo === "login" ? fazerLogin : criarConta}
              />
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // =====================================================
  // MENU USUÁRIO
  // =====================================================

  if (tela === "menu") {
    return (
      <View style={styles.center}>
        <Animated.View
          style={[
            styles.cardGrande,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <LogoMenu logoAnim={logoAnim} />

          <Text style={styles.tag}>ANGEL TRANSPORTS</Text>
          <Text style={styles.cardTitle}>Área do responsável</Text>
          <Text style={styles.descricao}>
            Cadastre crianças, acompanhe seus dados e veja avisos importantes.
          </Text>

          <BotaoAnimado
            texto="Cadastrar criança"
            onPress={() => setTela("cadastro")}
          />

          <BotaoAnimado
            texto="Ver meu perfil"
            secundario
            onPress={() => setTela("perfil")}
          />

          <BotaoAnimado
            texto="Ver avisos"
            secundario
            onPress={() => setTela("avisosUsuario")}
          />

          <TouchableOpacity style={styles.linkButton} onPress={sair}>
            <Text style={styles.linkText}>Sair da conta</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  // =====================================================
  // PERFIL
  // =====================================================

  if (tela === "perfil") {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.page}>
        <HeaderPagina
          titulo="Meu perfil"
          subtitulo="Veja suas crianças e acompanhe os dados cadastrados."
          voltar={() => setTela("menu")}
        />

        {carregandoPerfil ? (
          <ActivityIndicator size="large" color={VINHO} />
        ) : meusAlunos.length === 0 ? (
          <Vazio texto="Nenhuma criança cadastrada." />
        ) : (
          meusAlunos.map((aluno, index) => (
            <CardAnimado key={aluno.id} delay={index * 80}>
              <AlunoCard aluno={aluno} />
            </CardAnimado>
          ))
        )}

        <Text style={styles.secaoTitulo}>Avisos recentes</Text>

        {avisos.slice(0, 3).map((aviso) => (
          <AvisoCard key={aviso.id} aviso={aviso} />
        ))}
      </ScrollView>
    );
  }

  // =====================================================
  // AVISOS USUÁRIO
  // =====================================================

  if (tela === "avisosUsuario") {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.page}>
        <HeaderPagina
          titulo="Avisos"
          subtitulo="Comunicados da Angel Transports."
          voltar={() => setTela("menu")}
        />

        {avisos.length === 0 ? (
          <Vazio texto="Nenhum aviso publicado." />
        ) : (
          avisos.map((aviso, index) => (
            <CardAnimado key={aviso.id} delay={index * 70}>
              <AvisoCard aviso={aviso} />
            </CardAnimado>
          ))
        )}
      </ScrollView>
    );
  }

  // =====================================================
  // CADASTRO
  // =====================================================

  if (tela === "cadastro") {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.page}
        keyboardShouldPersistTaps="handled"
      >
        <HeaderPagina
          titulo="Cadastro da criança"
          subtitulo="Preencha os dados abaixo."
          voltar={() => setTela("menu")}
        />

        <Animated.View
          style={[
            styles.card,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Campo
            label="Nome da criança"
            value={nomeAluno}
            onChange={setNomeAluno}
            placeholder="Nome completo"
          />

          <Campo
            label="Nome do responsável"
            value={nomeResponsavel}
            onChange={setNomeResponsavel}
            placeholder="Nome do responsável"
          />

          <Campo
            label="Telefone"
            value={telefone}
            onChange={setTelefone}
            placeholder="(00) 00000-0000"
          />

          <Campo
            label="Bairro"
            value={bairro}
            onChange={setBairro}
            placeholder="Digite o bairro"
          />

          <Campo
            label="Escola"
            value={escola}
            onChange={setEscola}
            placeholder="Digite a escola"
          />

          <Campo
            label="Turno"
            value={turno}
            onChange={setTurno}
            placeholder="Ex: Manhã"
          />

          <BotaoAnimado
            texto="Cadastrar criança"
            carregando={salvando}
            onPress={cadastrarAluno}
          />
        </Animated.View>
      </ScrollView>
    );
  }

  // =====================================================
  // SUCESSO
  // =====================================================

  if (tela === "sucesso") {
    return (
      <View style={styles.center}>
        <Animated.View
          style={[
            styles.cardGrande,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.checkCircle}>
            <Text style={styles.check}>✓</Text>
          </View>

          <Text style={styles.sucessoTitle}>Criança cadastrada!</Text>

          <Text style={styles.centerText}>
            {nomeAluno} foi cadastrado com sucesso e salvo no Firebase.
          </Text>

          <View style={styles.idBox}>
            <Text style={styles.idLabel}>ID do cadastro</Text>
            <Text style={styles.idText}>{cadastroId}</Text>
          </View>

          <BotaoAnimado
            texto="Cadastrar outra criança"
            onPress={() => {
              limparCadastro();
              setTela("cadastro");
            }}
          />

          <BotaoAnimado
            texto="Ver meu perfil"
            secundario
            onPress={() => {
              limparCadastro();
              setTela("perfil");
            }}
          />
        </Animated.View>
      </View>
    );
  }

  // =====================================================
  // ADMIN
  // =====================================================

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.adminPage}
    >
      <Animated.View
        style={[
          styles.adminTop,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View>
          <Text style={styles.tag}>ADMINISTRADOR</Text>
          <Text style={styles.adminTitle}>Angel Transports</Text>
          <Text style={styles.adminSub}>
            Gestão completa do transporte escolar
          </Text>
        </View>

        <TouchableOpacity style={styles.sairButton} onPress={sair}>
          <Text style={styles.sairButtonText}>Sair</Text>
        </TouchableOpacity>
      </Animated.View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.adminTabs}
      >
        <AdminTab
          texto="Dashboard"
          ativo={rotaAdmin === "dashboard"}
          onPress={() => setRotaAdmin("dashboard")}
        />
        <AdminTab
          texto="Alunos"
          ativo={rotaAdmin === "alunos"}
          onPress={() => setRotaAdmin("alunos")}
        />
        <AdminTab
          texto="Pagamentos"
          ativo={rotaAdmin === "pagamentos"}
          onPress={() => setRotaAdmin("pagamentos")}
        />
        <AdminTab
          texto="Calendário"
          ativo={rotaAdmin === "calendario"}
          onPress={() => setRotaAdmin("calendario")}
        />
        <AdminTab
          texto="Rotas"
          ativo={rotaAdmin === "rotas"}
          onPress={() => setRotaAdmin("rotas")}
        />
        <AdminTab
          texto="Van"
          ativo={rotaAdmin === "van"}
          onPress={() => setRotaAdmin("van")}
        />
        <AdminTab
          texto="Avisos"
          ativo={rotaAdmin === "avisos"}
          onPress={() => setRotaAdmin("avisos")}
        />
        <AdminTab
          texto="Configurações"
          ativo={rotaAdmin === "configuracoes"}
          onPress={() => setRotaAdmin("configuracoes")}
        />
      </ScrollView>

      {/* DASHBOARD */}

      {rotaAdmin === "dashboard" && (
        <>
          <SeletorMes
            data={mesSelecionado}
            anterior={() =>
              setMesSelecionado(new Date(anoAtual, mesAtual - 2, 1))
            }
            proximo={() =>
              setMesSelecionado(new Date(anoAtual, mesAtual, 1))
            }
          />

          <View style={styles.dashboardGrid}>
            <ResumoCard titulo="Alunos" valor={String(alunos.length)} />
            <ResumoCard titulo="Pagos" valor={String(totalPago)} verde />
            <ResumoCard
              titulo="Pendentes"
              valor={String(totalPendente)}
              vermelho
            />
            <ResumoCard titulo="Vencem em breve" valor={String(vencendo)} />
            <ResumoCard titulo="Rotas" valor={String(rotas.length)} />
            <ResumoCard
              titulo="Recebido no mês"
              valor={`R$ ${totalRecebido.toFixed(2).replace(".", ",")}`}
              verde
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.secaoTituloSemMargem}>Situação financeira</Text>

            <BarraResumo
              titulo="Pagos"
              valor={totalPago}
              total={Math.max(alunos.length, 1)}
              tipo="verde"
            />

            <BarraResumo
              titulo="Pendentes"
              valor={totalPendente}
              total={Math.max(alunos.length, 1)}
              tipo="vermelho"
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.secaoTituloSemMargem}>Visão rápida</Text>
            <Info titulo="Escolas cadastradas" valor={String(config.escolas.length)} />
            <Info titulo="Bairros cadastrados" valor={String(config.bairros.length)} />
            <Info titulo="Avisos publicados" valor={String(avisos.length)} />
            <Info titulo="Modelo da van" valor={van.modelo || "Não informado"} />
          </View>
        </>
      )}

      {/* ALUNOS */}

      {rotaAdmin === "alunos" && (
        <>
          <View style={styles.toolbar}>
            <TextInput
              style={[styles.input, styles.inputBusca]}
              placeholder="Buscar por aluno, responsável, escola ou bairro"
              placeholderTextColor="#9C8F92"
              value={buscaAluno}
              onChangeText={setBuscaAluno}
            />

            <TouchableOpacity style={styles.exportarButton} onPress={exportarAlunos}>
              <Text style={styles.exportarButtonText}>Exportar CSV</Text>
            </TouchableOpacity>
          </View>

          {carregandoAlunos ? (
            <ActivityIndicator size="large" color={VINHO} />
          ) : alunosFiltrados.length === 0 ? (
            <Vazio texto="Nenhum aluno encontrado." />
          ) : (
            alunosFiltrados.map((aluno, index) => (
              <CardAnimado key={aluno.id} delay={index * 55}>
                <AlunoCard aluno={aluno} />
              </CardAnimado>
            ))
          )}
        </>
      )}

      {/* PAGAMENTOS */}

      {rotaAdmin === "pagamentos" && (
        <>
          <SeletorMes
            data={mesSelecionado}
            anterior={() =>
              setMesSelecionado(new Date(anoAtual, mesAtual - 2, 1))
            }
            proximo={() =>
              setMesSelecionado(new Date(anoAtual, mesAtual, 1))
            }
          />

          <View style={styles.toolbar}>
            <Text style={styles.pagamentoExplicacao}>
              Marque quem pagou, defina vencimento, valor e observações.
            </Text>

            <TouchableOpacity
              style={styles.exportarButton}
              onPress={exportarPagamentos}
            >
              <Text style={styles.exportarButtonText}>Exportar CSV</Text>
            </TouchableOpacity>
          </View>

          {carregandoPagamentos ? (
            <ActivityIndicator size="large" color={VINHO} />
          ) : (
            alunos.map((aluno, index) => {
              const pagamento = pagamentos.find(
                (item) => item.alunoId === aluno.id
              );

              return (
                <CardAnimado key={aluno.id} delay={index * 55}>
                  <PagamentoCard
                    aluno={aluno}
                    pagamento={pagamento}
                    valorPadrao={config.valorMensalPadrao}
                    alterar={alterarPagamento}
                    salvarDados={salvarDataVencimento}
                  />
                </CardAnimado>
              );
            })
          )}
        </>
      )}

      {/* CALENDÁRIO */}

      {rotaAdmin === "calendario" && (
        <>
          <SeletorMes
            data={mesSelecionado}
            anterior={() =>
              setMesSelecionado(new Date(anoAtual, mesAtual - 2, 1))
            }
            proximo={() =>
              setMesSelecionado(new Date(anoAtual, mesAtual, 1))
            }
          />

          <CalendarioPagamentos
            data={mesSelecionado}
            pagamentos={pagamentos}
          />
        </>
      )}

      {/* ROTAS */}

      {rotaAdmin === "rotas" && (
        <>
          <View style={styles.card}>
            <Text style={styles.secaoTituloSemMargem}>Nova rota</Text>

            <Campo
              label="Nome da rota"
              value={nomeRota}
              onChange={setNomeRota}
              placeholder="Ex: Rota Norte"
            />

            <Campo
              label="Bairros"
              value={bairrosRota}
              onChange={setBairrosRota}
              placeholder="Ex: Jardim Amanda, Rosolém..."
            />

            <Campo
              label="Escolas"
              value={escolasRota}
              onChange={setEscolasRota}
              placeholder="Escolas atendidas"
            />

            <Campo
              label="Horário"
              value={horarioRota}
              onChange={setHorarioRota}
              placeholder="Ex: 06:20 - 07:10"
            />

            <Campo
              label="Observações"
              value={observacoesRota}
              onChange={setObservacoesRota}
              placeholder="Informações extras"
            />

            <BotaoAnimado texto="Salvar rota" onPress={criarRota} />
          </View>

          {rotas.length === 0 ? (
            <Vazio texto="Nenhuma rota cadastrada." />
          ) : (
            rotas.map((rota) => (
              <View key={rota.id} style={styles.alunoCard}>
                <Text style={styles.alunoNome}>{rota.nome}</Text>
                <Info titulo="Bairros" valor={rota.bairros} />
                <Info titulo="Escolas" valor={rota.escolas} />
                <Info titulo="Horário" valor={rota.horario || "Não informado"} />
                <Info
                  titulo="Observações"
                  valor={rota.observacoes || "Sem observações"}
                />
              </View>
            ))
          )}
        </>
      )}

      {/* VAN */}

      {rotaAdmin === "van" && (
        <View style={styles.card}>
          <Text style={styles.secaoTituloSemMargem}>Dados da van</Text>

          <Campo
            label="Modelo"
            value={van.modelo}
            onChange={(texto) => setVan({ ...van, modelo: texto })}
            placeholder="Ex: Renault Master"
          />

          <Campo
            label="Ano"
            value={van.ano}
            onChange={(texto) => setVan({ ...van, ano: texto })}
            placeholder="Ex: 2018"
          />

          <Campo
            label="Placa"
            value={van.placa}
            onChange={(texto) => setVan({ ...van, placa: texto })}
            placeholder="Digite a placa"
          />

          <Campo
            label="Capacidade"
            value={van.capacidade}
            onChange={(texto) => setVan({ ...van, capacidade: texto })}
            placeholder="Ex: 15 passageiros"
          />

          <Campo
            label="Observações"
            value={van.observacoes}
            onChange={(texto) => setVan({ ...van, observacoes: texto })}
            placeholder="Informações sobre a van"
          />

          <BotaoAnimado texto="Salvar dados da van" onPress={salvarVan} />
        </View>
      )}

      {/* AVISOS */}

      {rotaAdmin === "avisos" && (
        <>
          <View style={styles.card}>
            <Text style={styles.secaoTituloSemMargem}>Novo aviso</Text>

            <Campo
              label="Título"
              value={tituloAviso}
              onChange={setTituloAviso}
              placeholder="Ex: Alteração de horário"
            />

            <Text style={styles.label}>Mensagem</Text>

            <TextInput
              style={[styles.input, styles.textArea]}
              multiline
              value={mensagemAviso}
              onChangeText={setMensagemAviso}
              placeholder="Digite o aviso..."
              placeholderTextColor="#9C8F92"
            />

            <BotaoAnimado texto="Publicar aviso" onPress={criarAviso} />
          </View>

          {avisos.length === 0 ? (
            <Vazio texto="Nenhum aviso publicado." />
          ) : (
            avisos.map((aviso) => <AvisoCard key={aviso.id} aviso={aviso} />)
          )}
        </>
      )}

      {/* CONFIGURAÇÕES */}

      {rotaAdmin === "configuracoes" && (
        <>
          <View style={styles.card}>
            <Text style={styles.secaoTituloSemMargem}>Mensalidade padrão</Text>

            <Campo
              label="Valor mensal padrão"
              value={config.valorMensalPadrao}
              onChange={(texto) =>
                setConfig({ ...config, valorMensalPadrao: texto })
              }
              placeholder="Ex: 250"
            />

            <BotaoAnimado
              texto="Salvar mensalidade"
              onPress={() => salvarConfiguracoes(config)}
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.secaoTituloSemMargem}>Escolas atendidas</Text>

            <Campo
              label="Nova escola"
              value={novaEscola}
              onChange={setNovaEscola}
              placeholder="Nome da escola"
            />

            <BotaoAnimado texto="Adicionar escola" onPress={adicionarEscola} />

            <View style={styles.chips}>
              {config.escolas.map((item, index) => (
                <View key={`${item}-${index}`} style={styles.chip}>
                  <Text style={styles.chipText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.secaoTituloSemMargem}>Bairros atendidos</Text>

            <Campo
              label="Novo bairro"
              value={novoBairro}
              onChange={setNovoBairro}
              placeholder="Nome do bairro"
            />

            <BotaoAnimado texto="Adicionar bairro" onPress={adicionarBairro} />

            <View style={styles.chips}>
              {config.bairros.map((item, index) => (
                <View key={`${item}-${index}`} style={styles.chip}>
                  <Text style={styles.chipText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );
}

// =====================================================
// COMPONENTES
// =====================================================

function LogoMenu({ logoAnim }: { logoAnim: Animated.Value }) {
  return (
    <Animated.View
      style={[
        styles.menuLogoImagemContainer,
        {
          transform: [{ translateY: logoAnim }],
        },
      ]}
    >
      <Image
        source={require("../../assets/images/logo-at.png")}
        style={styles.menuLogoImagem}
        resizeMode="contain"
      />
    </Animated.View>
  );
}

function BotaoAnimado({
  texto,
  onPress,
  secundario = false,
  carregando = false,
}: {
  texto: string;
  onPress: () => void;
  secundario?: boolean;
  carregando?: boolean;
}) {
  const escala = useRef(new Animated.Value(1)).current;

  return (
    <Animated.View
      style={{
        width: "100%",
        transform: [{ scale: escala }],
      }}
    >
      <TouchableOpacity
        style={secundario ? styles.botaoSecundario : styles.botaoPrincipal}
        onPress={onPress}
        onPressIn={() => {
          Animated.spring(escala, {
            toValue: 0.97,
            useNativeDriver: true,
          }).start();
        }}
        onPressOut={() => {
          Animated.spring(escala, {
            toValue: 1,
            useNativeDriver: true,
          }).start();
        }}
        disabled={carregando}
      >
        {carregando ? (
          <ActivityIndicator color={secundario ? VINHO : BRANCO} />
        ) : (
          <Text
            style={
              secundario
                ? styles.botaoSecundarioTexto
                : styles.botaoPrincipalTexto
            }
          >
            {texto}
          </Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

function CardAnimado({
  children,
  delay = 0,
}: {
  children: ReactNode;
  delay?: number;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const movimento = useRef(new Animated.Value(22)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(movimento, {
        toValue: 0,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={{
        opacity,
        transform: [{ translateY: movimento }],
      }}
    >
      {children}
    </Animated.View>
  );
}

function PagamentoCard({
  aluno,
  pagamento,
  valorPadrao,
  alterar,
  salvarDados,
}: {
  aluno: Aluno;
  pagamento?: Pagamento;
  valorPadrao: string;
  alterar: (
    aluno: Aluno,
    status: StatusPagamento,
    valor?: number,
    observacao?: string
  ) => Promise<void>;
  salvarDados: (
    aluno: Aluno,
    data: string,
    valor?: number,
    observacao?: string
  ) => Promise<void>;
}) {
  const [data, setData] = useState(pagamento?.dataVencimento || "");
  const [valor, setValor] = useState(
    String(pagamento?.valor ?? valorPadrao ?? "")
  );
  const [observacao, setObservacao] = useState(pagamento?.observacao || "");

  useEffect(() => {
    setData(pagamento?.dataVencimento || "");
    setValor(String(pagamento?.valor ?? valorPadrao ?? ""));
    setObservacao(pagamento?.observacao || "");
  }, [
    pagamento?.dataVencimento,
    pagamento?.valor,
    pagamento?.observacao,
    valorPadrao,
  ]);

  const pago = pagamento?.status === "pago";

  return (
    <View
      style={[
        styles.pagamentoCard,
        pago ? styles.pagamentoVerde : styles.pagamentoVermelho,
      ]}
    >
      <View style={styles.pagamentoTopo}>
        <View style={{ flex: 1 }}>
          <Text style={styles.pagamentoNome}>{aluno.nomeAluno}</Text>
          <Text style={styles.pagamentoEscola}>
            {aluno.escola || "Escola não informada"}
          </Text>
        </View>

        <View
          style={[
            styles.statusBadge,
            pago ? styles.statusBadgePago : styles.statusBadgeNaoPago,
          ]}
        >
          <Text
            style={[
              styles.statusBadgeText,
              {
                color: pago ? VERDE : VERMELHO,
              },
            ]}
          >
            {pago ? "PAGO" : "NÃO PAGO"}
          </Text>
        </View>
      </View>

      <View style={styles.switchArea}>
        <Text style={!pago ? styles.statusNaoPago : styles.statusDesativado}>
          Não pagou
        </Text>

        <Switch
          value={pago}
          onValueChange={(ativo) =>
            alterar(
              aluno,
              ativo ? "pago" : "nao_pago",
              Number(valor || 0),
              observacao
            )
          }
          trackColor={{
            false: "#E9A6AF",
            true: "#98D5A9",
          }}
          thumbColor={pago ? VERDE : VERMELHO}
        />

        <Text style={pago ? styles.statusPago : styles.statusDesativado}>
          Pagou
        </Text>
      </View>

      <Text style={styles.label}>Data de vencimento</Text>
      <TextInput
        style={styles.input}
        placeholder="Ex: 25/08/2026"
        placeholderTextColor="#9C8F92"
        value={data}
        onChangeText={setData}
      />

      <Text style={styles.label}>Valor</Text>
      <TextInput
        style={styles.input}
        placeholder="Ex: 250"
        placeholderTextColor="#9C8F92"
        keyboardType="decimal-pad"
        value={valor}
        onChangeText={setValor}
      />

      <Text style={styles.label}>Observação</Text>
      <TextInput
        style={styles.input}
        placeholder="Ex: Pagamento combinado..."
        placeholderTextColor="#9C8F92"
        value={observacao}
        onChangeText={setObservacao}
      />

      <BotaoAnimado
        texto="Salvar dados financeiros"
        onPress={() =>
          salvarDados(aluno, data, Number(valor || 0), observacao)
        }
      />

      {pagamento?.dataVencimento && (
        <View style={styles.dataBox}>
          <Text style={styles.dataBoxLabel}>Vencimento atual</Text>
          <Text style={styles.dataBoxValue}>{pagamento.dataVencimento}</Text>
        </View>
      )}

      {pago && pagamento?.dataPagamento && (
        <View style={styles.dataPagamentoBox}>
          <Text style={styles.dataPagamentoLabel}>Pagamento registrado em</Text>
          <Text style={styles.dataPagamentoValor}>
            {formatarTimestamp(pagamento.dataPagamento)}
          </Text>
        </View>
      )}
    </View>
  );
}

function CalendarioPagamentos({
  data,
  pagamentos,
}: {
  data: Date;
  pagamentos: Pagamento[];
}) {
  const ano = data.getFullYear();
  const mes = data.getMonth();

  const diasNoMes = new Date(ano, mes + 1, 0).getDate();
  const primeiroDia = new Date(ano, mes, 1).getDay();

  function quantidadePagamentos(dia: number) {
    return pagamentos.filter((pagamento) => {
      if (pagamento.status !== "pago" || !pagamento.dataPagamento) {
        return false;
      }

      try {
        const d = pagamento.dataPagamento.toDate();

        return (
          d.getDate() === dia &&
          d.getMonth() === mes &&
          d.getFullYear() === ano
        );
      } catch {
        return false;
      }
    }).length;
  }

  return (
    <View style={styles.calendario}>
      <Text style={styles.calendarioTitulo}>Calendário de pagamentos</Text>

      <View style={styles.diasSemana}>
        {["D", "S", "T", "Q", "Q", "S", "S"].map((item, index) => (
          <Text key={index} style={styles.diaSemana}>
            {item}
          </Text>
        ))}
      </View>

      <View style={styles.grade}>
        {Array.from({ length: primeiroDia }).map((_, index) => (
          <View key={`vazio-${index}`} style={styles.dia} />
        ))}

        {Array.from({ length: diasNoMes }, (_, index) => index + 1).map(
          (dia) => {
            const quantidade = quantidadePagamentos(dia);

            return (
              <View key={dia} style={styles.dia}>
                <Text style={styles.numeroDia}>{dia}</Text>

                {quantidade > 0 && (
                  <View style={styles.bolinha}>
                    <Text style={styles.bolinhaText}>{quantidade}</Text>
                  </View>
                )}
              </View>
            );
          }
        )}
      </View>

      <Text style={styles.secaoTitulo}>Pagamentos realizados</Text>

      {pagamentos.filter((p) => p.status === "pago").length === 0 ? (
        <Text style={styles.semPagamento}>
          Nenhum pagamento registrado neste mês.
        </Text>
      ) : (
        pagamentos
          .filter((p) => p.status === "pago")
          .map((pagamento) => (
            <View key={pagamento.id} style={styles.pagamentoCalendario}>
              <View>
                <Text style={styles.pagamentoCalendarioNome}>
                  {pagamento.nomeAluno}
                </Text>

                <Text style={styles.pagamentoCalendarioData}>
                  Pago em {formatarTimestamp(pagamento.dataPagamento)}
                </Text>

                {pagamento.dataVencimento && (
                  <Text style={styles.pagamentoCalendarioData}>
                    Vencimento: {pagamento.dataVencimento}
                  </Text>
                )}
              </View>

              <Text style={styles.pagoMiniBadge}>PAGO</Text>
            </View>
          ))
      )}
    </View>
  );
}

function SeletorMes({
  data,
  anterior,
  proximo,
}: {
  data: Date;
  anterior: () => void;
  proximo: () => void;
}) {
  const texto = data.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  return (
    <View style={styles.seletorMes}>
      <TouchableOpacity style={styles.mesButton} onPress={anterior}>
        <Text style={styles.mesButtonText}>‹</Text>
      </TouchableOpacity>

      <Text style={styles.mesTitulo}>
        {texto.charAt(0).toUpperCase() + texto.slice(1)}
      </Text>

      <TouchableOpacity style={styles.mesButton} onPress={proximo}>
        <Text style={styles.mesButtonText}>›</Text>
      </TouchableOpacity>
    </View>
  );
}

function AdminTab({
  texto,
  ativo,
  onPress,
}: {
  texto: string;
  ativo: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.adminTab, ativo && styles.adminTabAtiva]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.adminTabTexto,
          ativo && styles.adminTabTextoAtivo,
        ]}
      >
        {texto}
      </Text>
    </TouchableOpacity>
  );
}

function Campo({
  label,
  value,
  onChange,
  placeholder,
  email = false,
}: {
  label: string;
  value: string;
  onChange: (texto: string) => void;
  placeholder: string;
  email?: boolean;
}) {
  return (
    <>
      <Text style={styles.label}>{label}</Text>

      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#9C8F92"
        keyboardType={email ? "email-address" : "default"}
        autoCapitalize={email ? "none" : "sentences"}
      />
    </>
  );
}

function HeaderPagina({
  titulo,
  subtitulo,
  voltar,
}: {
  titulo: string;
  subtitulo: string;
  voltar: () => void;
}) {
  return (
    <View style={styles.pageHeader}>
      <View style={{ flex: 1 }}>
        <Text style={styles.tag}>ANGEL TRANSPORTS</Text>
        <Text style={styles.pageTitle}>{titulo}</Text>
        <Text style={styles.pageSubtitulo}>{subtitulo}</Text>
      </View>

      <TouchableOpacity style={styles.sairButton} onPress={voltar}>
        <Text style={styles.sairButtonText}>Voltar</Text>
      </TouchableOpacity>
    </View>
  );
}

function AlunoCard({ aluno }: { aluno: Aluno }) {
  return (
    <View style={styles.alunoCard}>
      <View style={styles.alunoTopo}>
        <View style={styles.alunoAvatar}>
          <Text style={styles.alunoAvatarText}>
            {aluno.nomeAluno?.charAt(0).toUpperCase() || "A"}
          </Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.alunoNome}>{aluno.nomeAluno}</Text>
          <Text style={styles.alunoEscola}>
            {aluno.escola || "Escola não informada"}
          </Text>
        </View>
      </View>

      <View style={styles.infoGrade}>
        <Info titulo="Responsável" valor={aluno.nomeResponsavel} />
        <Info titulo="Telefone" valor={aluno.telefone} />
        <Info titulo="Bairro" valor={aluno.bairro} />
        <Info titulo="Turno" valor={aluno.turno} />
      </View>
    </View>
  );
}

function AvisoCard({ aviso }: { aviso: Aviso }) {
  return (
    <View style={styles.avisoCard}>
      <Text style={styles.avisoTitulo}>{aviso.titulo}</Text>
      <Text style={styles.avisoMensagem}>{aviso.mensagem}</Text>
    </View>
  );
}

function Info({
  titulo,
  valor,
}: {
  titulo: string;
  valor?: string;
}) {
  return (
    <View style={styles.info}>
      <Text style={styles.infoTitulo}>{titulo}</Text>
      <Text style={styles.infoValor}>{valor || "Não informado"}</Text>
    </View>
  );
}

function Vazio({ texto }: { texto: string }) {
  return (
    <View style={styles.vazio}>
      <Text style={styles.vazioText}>{texto}</Text>
    </View>
  );
}

function ResumoCard({
  titulo,
  valor,
  verde = false,
  vermelho = false,
}: {
  titulo: string;
  valor: string;
  verde?: boolean;
  vermelho?: boolean;
}) {
  return (
    <View
      style={[
        styles.dashboardCard,
        verde && styles.dashboardCardVerde,
        vermelho && styles.dashboardCardVermelho,
      ]}
    >
      <Text style={styles.dashboardCardLabel}>{titulo}</Text>
      <Text
        style={[
          styles.dashboardCardValor,
          verde && { color: VERDE },
          vermelho && { color: VERMELHO },
        ]}
      >
        {valor}
      </Text>
    </View>
  );
}

function BarraResumo({
  titulo,
  valor,
  total,
  tipo,
}: {
  titulo: string;
  valor: number;
  total: number;
  tipo: "verde" | "vermelho";
}) {
  const percentual = Math.min((valor / total) * 100, 100);

  return (
    <View style={{ marginTop: 16 }}>
      <View style={styles.barraTopo}>
        <Text style={styles.barraTitulo}>{titulo}</Text>
        <Text style={styles.barraNumero}>{valor}</Text>
      </View>

      <View style={styles.barraFundo}>
        <View
          style={[
            styles.barraPreenchida,
            {
              width: `${percentual}%`,
              backgroundColor: tipo === "verde" ? VERDE : VERMELHO,
            },
          ]}
        />
      </View>
    </View>
  );
}

// =====================================================
// UTILITÁRIOS
// =====================================================

function formatarTimestamp(timestamp: any) {
  if (!timestamp) return "Data não disponível";

  try {
    return timestamp.toDate().toLocaleDateString("pt-BR");
  } catch {
    return "Data não disponível";
  }
}

function estaVencendoEmSeteDias(data?: string) {
  if (!data) return false;

  const partes = data.split("/");
  if (partes.length !== 3) return false;

  const [dia, mes, ano] = partes.map(Number);
  const vencimento = new Date(ano, mes - 1, dia);

  if (Number.isNaN(vencimento.getTime())) return false;

  const agora = new Date();
  agora.setHours(0, 0, 0, 0);
  vencimento.setHours(0, 0, 0, 0);

  const diferenca = vencimento.getTime() - agora.getTime();
  const dias = diferenca / (1000 * 60 * 60 * 24);

  return dias >= 0 && dias <= 7;
}

// =====================================================
// ESTILOS
// =====================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: FUNDO,
  },

  content: {
    flexGrow: 1,
    paddingBottom: 40,
  },

  hero: {
    minHeight: 350,
    backgroundColor: VINHO_ESCURO,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    padding: 20,
  },

  bolhaGrande: {
    position: "absolute",
    width: 450,
    height: 450,
    borderRadius: 225,
    backgroundColor: "#A93758",
    top: -210,
    right: -130,
  },

  bolhaPequena: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "#D06480",
    bottom: -140,
    left: -80,
  },

  logoImagemContainer: {
    width: 135,
    height: 135,
    marginBottom: 18,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 22,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    elevation: 9,
  },

  logoImagem: {
    width: "100%",
    height: "100%",
    borderRadius: 32,
  },

  menuLogoImagemContainer: {
    width: 105,
    height: 105,
    alignSelf: "center",
    marginBottom: 22,
  },

  menuLogoImagem: {
    width: "100%",
    height: "100%",
    borderRadius: 25,
  },

  title: {
    color: BRANCO,
    fontSize: 37,
    fontWeight: "900",
    textAlign: "center",
  },

  subtitle: {
    color: "#E9CDD5",
    fontSize: 15,
    marginTop: 8,
    textAlign: "center",
  },

  main: {
    width: "100%",
    maxWidth: 760,
    alignSelf: "center",
    padding: 18,
    marginTop: -38,
  },

  card: {
    backgroundColor: BRANCO,
    borderRadius: 27,
    padding: 26,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#EFE5E8",
    shadowColor: "#000",
    shadowOpacity: 0.09,
    shadowRadius: 20,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    elevation: 6,
  },

  cardGrande: {
    width: "100%",
    maxWidth: 550,
    backgroundColor: BRANCO,
    borderRadius: 30,
    padding: 32,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 25,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    elevation: 7,
  },

  tag: {
    color: VINHO_CLARO,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.4,
    marginBottom: 7,
  },

  cardTitle: {
    color: VINHO_ESCURO,
    fontSize: 29,
    fontWeight: "900",
    marginBottom: 7,
  },

  descricao: {
    color: "#786E71",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },

  tabs: {
    flexDirection: "row",
    backgroundColor: "#F2E9EC",
    padding: 5,
    borderRadius: 15,
    marginBottom: 23,
  },

  tab: {
    flex: 1,
    paddingVertical: 13,
    alignItems: "center",
    borderRadius: 11,
  },

  tabAtiva: {
    backgroundColor: VINHO,
  },

  tabText: {
    color: VINHO,
    fontWeight: "800",
  },

  tabTextAtiva: {
    color: BRANCO,
  },

  label: {
    color: "#403639",
    fontWeight: "700",
    fontSize: 13,
    marginBottom: 7,
  },

  input: {
    height: 57,
    borderWidth: 1,
    borderColor: "#E3DADD",
    borderRadius: 15,
    paddingHorizontal: 15,
    backgroundColor: "#FAF8F9",
    marginBottom: 17,
    color: "#251F21",
    fontSize: 15,
    outlineStyle: "none" as any,
  },

  textArea: {
    height: 120,
    paddingTop: 14,
    textAlignVertical: "top",
  },

  botaoPrincipal: {
    width: "100%",
    minHeight: 59,
    borderRadius: 17,
    backgroundColor: VINHO,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },

  botaoPrincipalTexto: {
    color: BRANCO,
    fontSize: 15,
    fontWeight: "900",
  },

  botaoSecundario: {
    width: "100%",
    minHeight: 59,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: VINHO,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
    backgroundColor: BRANCO,
  },

  botaoSecundarioTexto: {
    color: VINHO,
    fontSize: 15,
    fontWeight: "900",
  },

  center: {
    flex: 1,
    backgroundColor: FUNDO,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  linkButton: {
    alignItems: "center",
    padding: 16,
  },

  linkText: {
    color: "#8E8286",
    fontWeight: "700",
  },

  centerText: {
    textAlign: "center",
    color: "#73696C",
    marginBottom: 15,
  },

  checkCircle: {
    width: 92,
    height: 92,
    borderRadius: 46,
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E6F5EB",
    marginBottom: 20,
  },

  check: {
    color: VERDE,
    fontSize: 49,
    fontWeight: "900",
  },

  sucessoTitle: {
    color: VINHO_ESCURO,
    fontSize: 29,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 12,
  },

  idBox: {
    backgroundColor: "#FAF8F9",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },

  idLabel: {
    color: "#91868A",
    fontSize: 11,
    textAlign: "center",
  },

  idText: {
    color: VINHO_ESCURO,
    fontWeight: "800",
    textAlign: "center",
    marginTop: 4,
  },

  page: {
    width: "100%",
    maxWidth: 920,
    alignSelf: "center",
    padding: 20,
    paddingTop: 35,
    paddingBottom: 60,
  },

  pageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
    gap: 15,
  },

  pageTitle: {
    color: VINHO_ESCURO,
    fontSize: 31,
    fontWeight: "900",
  },

  pageSubtitulo: {
    color: "#786E71",
    marginTop: 5,
  },

  sairButton: {
    backgroundColor: "#F0E4E8",
    paddingHorizontal: 17,
    paddingVertical: 11,
    borderRadius: 13,
  },

  sairButtonText: {
    color: VINHO,
    fontWeight: "800",
  },

  alunoCard: {
    backgroundColor: BRANCO,
    padding: 22,
    borderRadius: 22,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#EFE5E8",
  },

  alunoTopo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },

  alunoAvatar: {
    width: 52,
    height: 52,
    borderRadius: 17,
    backgroundColor: "#F2E4E8",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },

  alunoAvatarText: {
    color: VINHO,
    fontSize: 21,
    fontWeight: "900",
  },

  alunoNome: {
    color: VINHO_ESCURO,
    fontSize: 21,
    fontWeight: "900",
  },

  alunoEscola: {
    color: "#8A7F82",
    fontSize: 12,
    marginTop: 3,
  },

  infoGrade: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  info: {
    minWidth: 140,
    flexGrow: 1,
    backgroundColor: "#FAF7F8",
    padding: 11,
    borderRadius: 12,
    marginTop: 5,
  },

  infoTitulo: {
    color: "#9A8F92",
    fontSize: 10,
    fontWeight: "700",
  },

  infoValor: {
    color: "#332B2D",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 3,
  },

  vazio: {
    backgroundColor: BRANCO,
    padding: 35,
    borderRadius: 22,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EEE5E8",
  },

  vazioText: {
    color: "#7E7477",
    textAlign: "center",
  },

  secaoTitulo: {
    color: VINHO_ESCURO,
    fontSize: 20,
    fontWeight: "900",
    marginTop: 24,
    marginBottom: 12,
  },

  secaoTituloSemMargem: {
    color: VINHO_ESCURO,
    fontSize: 20,
    fontWeight: "900",
    marginBottom: 18,
  },

  // ADMIN
  adminPage: {
    width: "100%",
    maxWidth: 1200,
    alignSelf: "center",
    padding: 20,
    paddingTop: 35,
    paddingBottom: 70,
  },

  adminTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 22,
  },

  adminTitle: {
    color: VINHO_ESCURO,
    fontSize: 33,
    fontWeight: "900",
  },

  adminSub: {
    color: "#807477",
    marginTop: 3,
  },

  adminTabs: {
    gap: 8,
    paddingBottom: 18,
  },

  adminTab: {
    minWidth: 125,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "center",
    borderRadius: 13,
    backgroundColor: BRANCO,
  },

  adminTabAtiva: {
    backgroundColor: VINHO,
  },

  adminTabTexto: {
    color: VINHO,
    fontWeight: "800",
  },

  adminTabTextoAtivo: {
    color: BRANCO,
  },

  dashboardGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 18,
  },

  dashboardCard: {
    flexGrow: 1,
    minWidth: 170,
    backgroundColor: BRANCO,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: "#ECE4E6",
  },

  dashboardCardVerde: {
    backgroundColor: "#F0FAF3",
    borderColor: "#B7DFC1",
  },

  dashboardCardVermelho: {
    backgroundColor: "#FFF2F4",
    borderColor: "#EDBCC3",
  },

  dashboardCardLabel: {
    color: "#8B8083",
    fontSize: 12,
    fontWeight: "700",
  },

  dashboardCardValor: {
    color: VINHO_ESCURO,
    fontSize: 28,
    fontWeight: "900",
    marginTop: 6,
  },

  barraTopo: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  barraTitulo: {
    color: "#504649",
    fontWeight: "800",
  },

  barraNumero: {
    color: "#8B8083",
    fontWeight: "800",
  },

  barraFundo: {
    height: 12,
    backgroundColor: "#EEE7E9",
    borderRadius: 99,
    overflow: "hidden",
    marginTop: 8,
  },

  barraPreenchida: {
    height: "100%",
    borderRadius: 99,
  },

  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 18,
    flexWrap: "wrap",
  },

  inputBusca: {
    flex: 1,
    minWidth: 250,
    marginBottom: 0,
  },

  exportarButton: {
    backgroundColor: "#F0E4E8",
    paddingHorizontal: 18,
    height: 57,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },

  exportarButtonText: {
    color: VINHO,
    fontWeight: "900",
  },

  // PAGAMENTO
  pagamentoExplicacao: {
    color: "#746A6D",
    flex: 1,
    minWidth: 260,
  },

  pagamentoCard: {
    borderRadius: 22,
    padding: 22,
    marginBottom: 16,
    borderWidth: 2,
  },

  pagamentoVerde: {
    borderColor: "#A6D9B4",
    backgroundColor: "#F0FAF3",
  },

  pagamentoVermelho: {
    borderColor: "#ECB1B9",
    backgroundColor: "#FFF2F4",
  },

  pagamentoTopo: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  pagamentoNome: {
    color: VINHO_ESCURO,
    fontSize: 21,
    fontWeight: "900",
  },

  pagamentoEscola: {
    color: "#827679",
    marginTop: 4,
  },

  statusBadge: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 12,
  },

  statusBadgePago: {
    backgroundColor: "#DDF2E3",
  },

  statusBadgeNaoPago: {
    backgroundColor: "#F9DDE1",
  },

  statusBadgeText: {
    fontSize: 11,
    fontWeight: "900",
  },

  switchArea: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginVertical: 22,
  },

  statusNaoPago: {
    color: VERMELHO,
    fontWeight: "900",
  },

  statusPago: {
    color: VERDE,
    fontWeight: "900",
  },

  statusDesativado: {
    color: "#A69B9E",
    fontWeight: "700",
  },

  dataBox: {
    backgroundColor: "#F3EBEE",
    padding: 13,
    borderRadius: 13,
    marginTop: 12,
  },

  dataBoxLabel: {
    color: "#91868A",
    fontSize: 11,
  },

  dataBoxValue: {
    color: VINHO_ESCURO,
    fontWeight: "900",
    marginTop: 3,
  },

  dataPagamentoBox: {
    backgroundColor: "#E6F5EB",
    padding: 13,
    borderRadius: 13,
    marginTop: 10,
  },

  dataPagamentoLabel: {
    color: "#6C8673",
    fontSize: 11,
  },

  dataPagamentoValor: {
    color: VERDE,
    fontWeight: "900",
    marginTop: 3,
  },

  // MÊS
  seletorMes: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: BRANCO,
    padding: 13,
    borderRadius: 18,
    marginBottom: 16,
  },

  mesButton: {
    width: 47,
    height: 47,
    borderRadius: 14,
    backgroundColor: "#F1E6E9",
    alignItems: "center",
    justifyContent: "center",
  },

  mesButtonText: {
    color: VINHO,
    fontSize: 28,
    fontWeight: "900",
  },

  mesTitulo: {
    color: VINHO_ESCURO,
    fontSize: 19,
    fontWeight: "900",
  },

  // CALENDÁRIO
  calendario: {
    backgroundColor: BRANCO,
    borderRadius: 22,
    padding: 20,
  },

  calendarioTitulo: {
    color: VINHO_ESCURO,
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 20,
  },

  diasSemana: {
    flexDirection: "row",
  },

  diaSemana: {
    width: "14.2857%",
    textAlign: "center",
    color: "#91868A",
    fontWeight: "800",
  },

  grade: {
    flexDirection: "row",
    flexWrap: "wrap",
  },

  dia: {
    width: "14.2857%",
    minHeight: 68,
    borderWidth: 0.5,
    borderColor: "#EEE7E9",
    alignItems: "center",
    padding: 6,
  },

  numeroDia: {
    color: "#3E3538",
    fontWeight: "700",
  },

  bolinha: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: VERDE,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 7,
  },

  bolinhaText: {
    color: BRANCO,
    fontSize: 11,
    fontWeight: "900",
  },

  semPagamento: {
    color: "#91868A",
    paddingVertical: 15,
  },

  pagamentoCalendario: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#EEE7E9",
    paddingVertical: 13,
  },

  pagamentoCalendarioNome: {
    color: VINHO_ESCURO,
    fontWeight: "900",
  },

  pagamentoCalendarioData: {
    color: "#7F7477",
    fontSize: 12,
    marginTop: 3,
  },

  pagoMiniBadge: {
    backgroundColor: "#E3F4E8",
    color: VERDE,
    fontSize: 11,
    fontWeight: "900",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },

  // AVISOS
  avisoCard: {
    backgroundColor: BRANCO,
    borderRadius: 18,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#EEE5E8",
  },

  avisoTitulo: {
    color: VINHO_ESCURO,
    fontSize: 17,
    fontWeight: "900",
  },

  avisoMensagem: {
    color: "#706568",
    lineHeight: 20,
    marginTop: 7,
  },

  // CHIPS
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 18,
  },

  chip: {
    backgroundColor: "#F0E4E8",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 99,
  },

  chipText: {
    color: VINHO,
    fontSize: 12,
    fontWeight: "800",
  },
});
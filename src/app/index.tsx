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
  Pressable,
  Linking,
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
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
} from "firebase/auth";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  onSnapshot,
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
  | "informacoes"
  | "menu"
  | "cadastro"
  | "perfil"
  | "avisosUsuario"
  | "sucesso"
  | "admin";

type RotaAdmin =
  | "dashboard"
  | "solicitacoes"
  | "alunos"
  | "pagamentos"
  | "calendario"
  | "van"
  | "avisos"
  | "atividades"
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
  statusCadastro?: "pendente" | "ativo" | "inativo" | "recusado";
  aprovadoEm?: any;
  recusadoEm?: any;
  valorMensal?: number;
  diaVencimento?: number;
  observacoesInternas?: string;
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
  telefoneContato?: string;
};

type LogSistema = {
  id: string;
  acao?: string;
  detalhes?: string;
  adminEmail?: string;
  criadoEm?: any;
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
  const [erroLogin, setErroLogin] = useState("");

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
    telefoneContato: "",
  });
  const [novaEscola, setNovaEscola] = useState("");
  const [novoBairro, setNovoBairro] = useState("");

  // BUSCA E GESTÃO
  const [buscaAluno, setBuscaAluno] = useState("");
  const [filtroStatus, setFiltroStatus] =
    useState<"todos" | "ativo" | "inativo">("todos");
  const [filtroEscola, setFiltroEscola] = useState("");
  const [filtroBairro, setFiltroBairro] = useState("");
  const [filtroTurno, setFiltroTurno] = useState("");

  // DETALHES / EDIÇÃO DE ALUNO
  const [alunoSelecionado, setAlunoSelecionado] = useState<Aluno | null>(null);
  const [alunoEditando, setAlunoEditando] = useState<Aluno | null>(null);
  const [historicoSelecionado, setHistoricoSelecionado] = useState<Pagamento[]>([]);

  // PERFIL DO RESPONSÁVEL
  const [pagamentosPerfil, setPagamentosPerfil] = useState<Pagamento[]>([]);

  // LOGS
  const [logsSistema, setLogsSistema] = useState<LogSistema[]>([]);
  const [carregandoLogs, setCarregandoLogs] = useState(false);

  // SEGURANÇA
  const [novaSenhaPerfil, setNovaSenhaPerfil] = useState("");

// =====================================================
// LOGIN, CONTA E MENSAGENS DE ERRO
// =====================================================

function mensagemErroFirebase(error: any, mensagemPadrao: string) {
  const codigo = error?.code || "";

  switch (codigo) {
    // ================================
    // LOGIN / AUTENTICAÇÃO
    // ================================

    case "auth/invalid-email":
      return "O e-mail digitado não é válido.";

    case "auth/missing-email":
      return "Digite seu e-mail.";

    case "auth/missing-password":
      return "Digite sua senha.";

    case "auth/invalid-credential":
      return "E-mail ou senha incorretos.";

    case "auth/user-not-found":
      return "Não encontramos uma conta com esse e-mail.";

    case "auth/wrong-password":
      return "A senha digitada está incorreta.";

    case "auth/user-disabled":
      return "Essa conta foi desativada.";

    case "auth/too-many-requests":
      return "Muitas tentativas seguidas. Aguarde um pouco e tente novamente.";

    case "auth/network-request-failed":
      return "Erro de conexão. Verifique sua internet.";

    // ================================
    // CRIAÇÃO DE CONTA
    // ================================

    case "auth/email-already-in-use":
      return "Esse e-mail já possui uma conta cadastrada.";

    case "auth/weak-password":
      return "A senha é muito fraca. Use pelo menos 6 caracteres.";

    case "auth/operation-not-allowed":
      return "A criação de contas por e-mail não está habilitada no Firebase.";

    // ================================
    // FIRESTORE
    // ================================

    case "permission-denied":
    case "firestore/permission-denied":
      return "Você não tem permissão para realizar essa ação.";

    case "unavailable":
    case "firestore/unavailable":
      return "O Firebase está temporariamente indisponível. Tente novamente.";

    case "unauthenticated":
      return "Sua sessão expirou. Faça login novamente.";

    case "not-found":
      return "O registro solicitado não foi encontrado.";

    case "already-exists":
      return "Esse registro já existe.";

    case "resource-exhausted":
      return "O limite do serviço foi atingido. Tente novamente mais tarde.";

    case "failed-precondition":
      return "Não foi possível concluir essa operação agora.";

    default:
      return mensagemPadrao;
  }
}

function mostrarErro(
  titulo: string,
  error: any,
  mensagemPadrao: string
) {
  console.log(titulo, error);

  Alert.alert(
    titulo,
    mensagemErroFirebase(error, mensagemPadrao)
  );
}

// =====================================================
// LOGIN ADM E USUÁRIO
// =====================================================

async function fazerLogin() {
  const emailLimpo = email.trim().toLowerCase();
  const senhaLimpa = senha.trim();

  setErroLogin("");

  if (!emailLimpo && !senhaLimpa) {
    setErroLogin("Digite seu e-mail e sua senha.");
    return;
  }

  if (!emailLimpo) {
    setErroLogin("Digite seu e-mail.");
    return;
  }

  if (
    !emailLimpo.includes("@") ||
    !emailLimpo.includes(".")
  ) {
    setErroLogin("Digite um e-mail válido.");
    return;
  }

  if (!senhaLimpa) {
    setErroLogin("Digite sua senha.");
    return;
  }

  try {
    setCarregando(true);

    const credencial = await signInWithEmailAndPassword(
      auth,
      emailLimpo,
      senha
    );

    setErroLogin("");

    const emailLogado = credencial.user.email
      ?.toLowerCase()
      .trim();

    if (emailLogado === EMAIL_ADMIN) {
      setRotaAdmin("dashboard");
      setTela("admin");
      return;
    }

    setTela("menu");
  } catch (error: any) {
    console.log("ERRO LOGIN:", error);

    if (
      error.code === "auth/invalid-credential" ||
      error.code === "auth/wrong-password" ||
      error.code === "auth/user-not-found"
    ) {
      setErroLogin("E-mail ou senha incorretos.");
    } else if (error.code === "auth/invalid-email") {
      setErroLogin("O e-mail digitado não é válido.");
    } else if (error.code === "auth/user-disabled") {
      setErroLogin("Essa conta foi desativada.");
    } else if (error.code === "auth/too-many-requests") {
      setErroLogin(
        "Muitas tentativas. Aguarde um pouco e tente novamente."
      );
    } else if (error.code === "auth/network-request-failed") {
      setErroLogin(
        "Erro de conexão. Verifique sua internet."
      );
    } else {
      setErroLogin(
        "Não foi possível entrar. Tente novamente."
      );
    }
  } finally {
    setCarregando(false);
  }
}

// =====================================================
// CRIAÇÃO DE CONTA
// =====================================================

async function criarConta() {
  const nomeLimpo = nomeUsuario.trim();
  const emailLimpo = email.trim().toLowerCase();

  // NOME

  if (!nomeLimpo) {
    Alert.alert(
      "Nome obrigatório",
      "Digite seu nome para criar sua conta."
    );

    return;
  }

  if (nomeLimpo.length < 2) {
    Alert.alert(
      "Nome inválido",
      "Digite um nome válido."
    );

    return;
  }

  // E-MAIL

  if (!emailLimpo) {
    Alert.alert(
      "E-mail obrigatório",
      "Digite seu e-mail."
    );

    return;
  }

  if (
    !emailLimpo.includes("@") ||
    !emailLimpo.includes(".")
  ) {
    Alert.alert(
      "E-mail inválido",
      "Digite um e-mail válido. Exemplo: nome@email.com"
    );

    return;
  }

  // SENHA

  if (!senha) {
    Alert.alert(
      "Senha obrigatória",
      "Crie uma senha para sua conta."
    );

    return;
  }

  if (senha.length < 6) {
    Alert.alert(
      "Senha muito curta",
      "A senha precisa ter pelo menos 6 caracteres."
    );

    return;
  }

  if (!confirmarSenha) {
    Alert.alert(
      "Confirme sua senha",
      "Digite novamente a senha."
    );

    return;
  }

  if (senha !== confirmarSenha) {
    Alert.alert(
      "Senhas diferentes",
      "As duas senhas precisam ser iguais."
    );

    return;
  }

  try {
    setCarregando(true);

    // CRIA A CONTA NO FIREBASE AUTH

    const credencial =
      await createUserWithEmailAndPassword(
        auth,
        emailLimpo,
        senha
      );

    if (!credencial.user) {
      Alert.alert(
        "Erro",
        "A conta não pôde ser criada."
      );

      return;
    }

    // SALVA O PERFIL NO FIRESTORE

    try {
      await setDoc(
        doc(
          db,
          "users",
          credencial.user.uid
        ),
        {
          name: nomeLimpo,

          email:
            credencial.user.email,

          role: "responsavel",

          criadoEm:
            serverTimestamp(),
        }
      );
    } catch (errorFirestore: any) {
      mostrarErro(
        "Erro ao salvar perfil",
        errorFirestore,
        "Sua conta foi criada, mas houve um problema ao salvar seu perfil."
      );

      return;
    }

    setSenha("");
    setConfirmarSenha("");

    Alert.alert(
      "Conta registrada!",
      "Sua conta foi criada com sucesso. Agora você pode cadastrar a criança."
    );

    // Vai direto para cadastro
    setTela("cadastro");
  } catch (error: any) {
    mostrarErro(
      "Erro ao criar conta",
      error,
      "Não foi possível criar sua conta. Tente novamente."
    );
  } finally {
    setCarregando(false);
  }
}

async function recuperarSenha() {
  const emailLimpo = email.trim().toLowerCase();

  if (!emailLimpo) {
    setErroLogin("Digite seu e-mail primeiro para recuperar a senha.");
    return;
  }

  try {
    await sendPasswordResetEmail(auth, emailLimpo);

    Alert.alert(
      "E-mail enviado",
      "Enviamos um link para redefinir sua senha. Confira sua caixa de entrada e o spam."
    );
  } catch (error: any) {
    setErroLogin(
      mensagemErroFirebase(
        error,
        "Não foi possível enviar o e-mail de recuperação."
      )
    );
  }
}

async function trocarSenhaAtual() {
  const usuario = auth.currentUser;

  if (!usuario) {
    Alert.alert("Sessão expirada", "Faça login novamente.");
    return;
  }

  if (novaSenhaPerfil.length < 6) {
    Alert.alert(
      "Senha muito curta",
      "A nova senha precisa ter pelo menos 6 caracteres."
    );
    return;
  }

  try {
    await updatePassword(usuario, novaSenhaPerfil);
    setNovaSenhaPerfil("");

    Alert.alert(
      "Senha alterada",
      "Sua senha foi atualizada com sucesso."
    );
  } catch (error: any) {
    mostrarErro(
      "Erro ao trocar senha",
      error,
      "Por segurança, talvez seja necessário sair e entrar novamente antes de trocar a senha."
    );
  }
}

function confirmarAcao(
  titulo: string,
  mensagem: string,
  confirmar: () => void
) {
  if (Platform.OS === "web") {
    const g: any = globalThis as any;
    if (g.confirm(`${titulo}\n\n${mensagem}`)) confirmar();
    return;
  }

  Alert.alert(titulo, mensagem, [
    { text: "Cancelar", style: "cancel" },
    {
      text: "Confirmar",
      style: "destructive",
      onPress: confirmar,
    },
  ]);
}

function abrirWhatsApp(numero?: string, mensagem?: string) {
  if (!numero) {
    Alert.alert(
      "WhatsApp não configurado",
      "O telefone público ainda não foi carregado."
    );
    return;
  }

  const limpo = numero.replace(/\D/g, "");

  const telefone = limpo.startsWith("55")
    ? limpo
    : `55${limpo}`;

  const texto = encodeURIComponent(
    mensagem ||
      "Olá! Tenho interesse no transporte escolar da Angel Transports."
  );

  const url = `https://wa.me/${telefone}?text=${texto}`;

  if (Platform.OS === "web") {
    const g: any = globalThis as any;
    g.window.open(url, "_blank", "noopener,noreferrer");
    return;
  }

  Linking.openURL(url).catch(() => {
    Alert.alert(
      "Erro",
      "Não foi possível abrir o WhatsApp."
    );
  });
}

// =====================================================
// SAIR DA CONTA
// =====================================================

async function sair() {
  try {
    await signOut(auth);

    setEmail("");
    setSenha("");
    setNomeUsuario("");
    setConfirmarSenha("");

    limparCadastro();

    setTela("inicio");
    setModo("login");
  } catch (error: any) {
    mostrarErro(
      "Erro ao sair",
      error,
      "Não foi possível sair da sua conta. Tente novamente."
    );
  }
}

// =====================================================
// ALUNOS
// =====================================================

async function cadastrarAluno() {
  // NOME DA CRIANÇA

  if (!nomeAluno.trim()) {
    Alert.alert(
      "Nome obrigatório",
      "Digite o nome da criança."
    );

    return;
  }

  if (nomeAluno.trim().length < 2) {
    Alert.alert(
      "Nome inválido",
      "Digite um nome válido para a criança."
    );

    return;
  }

  // RESPONSÁVEL

  if (!nomeResponsavel.trim()) {
    Alert.alert(
      "Responsável obrigatório",
      "Digite o nome do responsável."
    );

    return;
  }

  // TELEFONE

  if (!telefone.trim()) {
    Alert.alert(
      "Telefone obrigatório",
      "Digite um telefone para contato."
    );

    return;
  }

  const telefoneNumeros =
    telefone.replace(/\D/g, "");

  if (telefoneNumeros.length < 10) {
    Alert.alert(
      "Telefone inválido",
      "Digite um telefone válido com DDD."
    );

    return;
  }

  if (telefoneNumeros.length > 11) {
    Alert.alert(
      "Telefone inválido",
      "O telefone informado possui números demais."
    );

    return;
  }

  // BAIRRO

  if (!bairro.trim()) {
    Alert.alert(
      "Bairro obrigatório",
      "Informe o bairro onde a criança mora."
    );

    return;
  }

  // ESCOLA

  if (!escola.trim()) {
    Alert.alert(
      "Escola obrigatória",
      "Informe a escola da criança."
    );

    return;
  }

  // TURNO

  if (!turno.trim()) {
    Alert.alert(
      "Turno obrigatório",
      "Informe o turno escolar."
    );

    return;
  }

  try {
    setSalvando(true);

    const usuario =
      auth.currentUser;

    if (!usuario) {
      Alert.alert(
        "Sessão expirada",
        "Sua sessão terminou. Faça login novamente antes de cadastrar a criança."
      );

      setTela("inicio");

      return;
    }

    // SALVA O ALUNO COMO PENDENTE

    const documento =
      await addDoc(
        collection(
          db,
          "alunos"
        ),
        {
          nomeAluno:
            nomeAluno.trim(),

          nomeResponsavel:
            nomeResponsavel.trim(),

          telefone:
            telefone.trim(),

          bairro:
            bairro.trim(),

          escola:
            escola.trim(),

          turno:
            turno.trim(),

          usuarioUid:
            usuario.uid,

          usuarioEmail:
            usuario.email || "",

          statusCadastro:
            "pendente",

          valorMensal: Number(config.valorMensalPadrao || 0),
          diaVencimento: 10,

          criadoEm:
            serverTimestamp(),
        }
      );

    if (!documento.id) {
      Alert.alert(
        "Erro no cadastro",
        "O Firebase não retornou o ID do cadastro."
      );

      return;
    }

    setCadastroId(
      documento.id
    );

    setTela("sucesso");
  } catch (error: any) {
    mostrarErro(
      "Erro no cadastro da criança",
      error,
      "Não foi possível enviar o cadastro da criança. Tente novamente."
    );
  } finally {
    setSalvando(false);
  }

}

// =====================================================
// BUSCAR ALUNOS DO RESPONSÁVEL
// =====================================================

async function buscarMeusAlunos() {
  try {
    setCarregandoPerfil(true);

    const usuario = auth.currentUser;

    if (!usuario) {
      Alert.alert(
        "Sessão expirada",
        "Faça login novamente para visualizar seus alunos."
      );

      setTela("inicio");
      return;
    }

    const consulta = query(
      collection(db, "alunos"),
      where("usuarioUid", "==", usuario.uid)
    );

    const resposta = await getDocs(consulta);

    const lista = resposta.docs.map((item) => ({
      id: item.id,
      ...(item.data() as Omit<Aluno, "id">),
    }));

    setMeusAlunos(lista);

    try {
      const consultas = await Promise.all(
        lista.map((aluno) =>
          getDocs(
            query(
              collection(db, "pagamentos"),
              where("alunoId", "==", aluno.id)
            )
          )
        )
      );

      const todos = consultas.flatMap((resposta) =>
        resposta.docs.map((item) => ({
          id: item.id,
          ...(item.data() as Omit<Pagamento, "id">),
        }))
      );

      setPagamentosPerfil(todos);
    } catch (erroPagamentos) {
      console.log("Erro ao carregar pagamentos do perfil:", erroPagamentos);
    }
  } catch (error: any) {
    mostrarErro(
      "Erro ao carregar seus alunos",
      error,
      "Não foi possível carregar os alunos cadastrados."
    );
  } finally {
    setCarregandoPerfil(false);
  }
}

// =====================================================
// BUSCAR TODOS OS ALUNOS - ADM
// =====================================================

async function buscarAlunos() {
  try {
    setCarregandoAlunos(true);

    const usuario = auth.currentUser;

    if (!usuario) {
      Alert.alert(
        "Sessão expirada",
        "Faça login novamente."
      );

      setTela("inicio");
      return;
    }

    const resposta = await getDocs(
      collection(db, "alunos")
    );

    const lista = resposta.docs.map((item) => ({
      id: item.id,
      ...(item.data() as Omit<Aluno, "id">),
    }));

    setAlunos(lista);
  } catch (error: any) {
    mostrarErro(
      "Erro ao carregar alunos",
      error,
      "Não foi possível carregar a lista de alunos."
    );
  } finally {
    setCarregandoAlunos(false);
  }
}

// =====================================================
// APROVAR / RECUSAR ALUNOS - ADM
// =====================================================

async function aprovarAluno(aluno: Aluno) {
  try {
    await setDoc(
      doc(db, "alunos", aluno.id),
      {
        statusCadastro: "ativo",
        aprovadoEm: serverTimestamp(),
        recusadoEm: null,
      },
      { merge: true }
    );

    await registrarLog(
      "Aluno aprovado",
      aluno.nomeAluno || aluno.id
    );

    await buscarAlunos();

    Alert.alert(
      "Aluno aprovado",
      `${aluno.nomeAluno || "Aluno"} agora faz parte da lista de alunos ativos.`
    );
  } catch (error: any) {
    mostrarErro(
      "Erro ao aprovar aluno",
      error,
      "Não foi possível aprovar esse aluno. Tente novamente."
    );
  }
}

async function recusarAluno(aluno: Aluno) {
  try {
    await setDoc(
      doc(db, "alunos", aluno.id),
      {
        statusCadastro: "recusado",
        recusadoEm: serverTimestamp(),
      },
      { merge: true }
    );

    await registrarLog(
      "Cadastro recusado",
      aluno.nomeAluno || aluno.id
    );

    await buscarAlunos();

    Alert.alert(
      "Cadastro recusado",
      `${aluno.nomeAluno || "Aluno"} foi removido das solicitações pendentes.`
    );
  } catch (error: any) {
    mostrarErro(
      "Erro ao recusar cadastro",
      error,
      "Não foi possível recusar esse cadastro. Tente novamente."
    );
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

async function salvarEdicaoAluno() {
  if (!alunoEditando) return;

  if (!alunoEditando.nomeAluno?.trim()) {
    Alert.alert("Nome obrigatório", "Informe o nome do aluno.");
    return;
  }

  try {
    await setDoc(
      doc(db, "alunos", alunoEditando.id),
      {
        nomeAluno: alunoEditando.nomeAluno?.trim() || "",
        nomeResponsavel: alunoEditando.nomeResponsavel?.trim() || "",
        telefone: alunoEditando.telefone?.trim() || "",
        bairro: alunoEditando.bairro?.trim() || "",
        escola: alunoEditando.escola?.trim() || "",
        turno: alunoEditando.turno?.trim() || "",
        valorMensal: Number(alunoEditando.valorMensal || 0),
        diaVencimento: Number(alunoEditando.diaVencimento || 10),
        observacoesInternas: alunoEditando.observacoesInternas || "",
        atualizadoEm: serverTimestamp(),
      },
      { merge: true }
    );

    await registrarLog(
      "Aluno editado",
      alunoEditando.nomeAluno || alunoEditando.id
    );

    setAlunoEditando(null);
    await buscarAlunos();

    Alert.alert("Aluno atualizado", "As alterações foram salvas.");
  } catch (error: any) {
    mostrarErro(
      "Erro ao editar aluno",
      error,
      "Não foi possível salvar as alterações."
    );
  }
}

async function alternarStatusAluno(aluno: Aluno) {
  const ativoAtual =
    !aluno.statusCadastro || aluno.statusCadastro === "ativo";

  const novoStatus = ativoAtual ? "inativo" : "ativo";

  try {
    await setDoc(
      doc(db, "alunos", aluno.id),
      {
        statusCadastro: novoStatus,
        atualizadoEm: serverTimestamp(),
      },
      { merge: true }
    );

    await registrarLog(
      novoStatus === "ativo" ? "Aluno ativado" : "Aluno inativado",
      aluno.nomeAluno || aluno.id
    );

    await buscarAlunos();
  } catch (error: any) {
    mostrarErro(
      "Erro ao alterar status",
      error,
      "Não foi possível alterar o status do aluno."
    );
  }
}

async function excluirAluno(aluno: Aluno) {
  confirmarAcao(
    "Excluir aluno",
    `Tem certeza que deseja excluir ${aluno.nomeAluno || "este aluno"}? Essa ação remove o cadastro do Firebase.`,
    async () => {
      try {
        await deleteDoc(doc(db, "alunos", aluno.id));

        await registrarLog(
          "Aluno excluído",
          aluno.nomeAluno || aluno.id
        );

        if (alunoSelecionado?.id === aluno.id) setAlunoSelecionado(null);
        if (alunoEditando?.id === aluno.id) setAlunoEditando(null);

        await buscarAlunos();

        Alert.alert("Aluno excluído", "O cadastro foi excluído.");
      } catch (error: any) {
        mostrarErro(
          "Erro ao excluir aluno",
          error,
          "Não foi possível excluir esse aluno."
        );
      }
    }
  );
}

async function verDetalhesAluno(aluno: Aluno) {
  setAlunoSelecionado(aluno);

  try {
    const resposta = await getDocs(
      query(
        collection(db, "pagamentos"),
        where("alunoId", "==", aluno.id)
      )
    );

    const historico = resposta.docs
      .map((item) => ({
        id: item.id,
        ...(item.data() as Omit<Pagamento, "id">),
      }))
      .sort((a, b) => b.ano - a.ano || b.mes - a.mes);

    setHistoricoSelecionado(historico);
  } catch (error: any) {
    mostrarErro(
      "Erro ao carregar histórico",
      error,
      "Não foi possível carregar o histórico do aluno."
    );
  }
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
    } catch (error: any) {
      mostrarErro(
        "Erro ao carregar pagamentos",
        error,
        "Não foi possível carregar os pagamentos."
      );
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
    if (status === "nao_pago") {
      const existente = pagamentos.find((p) => p.alunoId === aluno.id);

      if (existente?.status === "pago") {
        confirmarAcao(
          "Marcar como não pago",
          `Deseja realmente remover a confirmação de pagamento de ${aluno.nomeAluno || "este aluno"}?`,
          () => alterarPagamentoConfirmado(aluno, status, valor, observacao)
        );
        return;
      }
    }

    await alterarPagamentoConfirmado(aluno, status, valor, observacao);
  }

  async function alterarPagamentoConfirmado(
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
          valor: valor ?? aluno.valorMensal ?? Number(config.valorMensalPadrao || 0),
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
    } catch (error: any) {
      mostrarErro(
        "Erro no pagamento",
        error,
        "Não foi possível atualizar o pagamento. Tente novamente."
      );
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
          valor: valor ?? existente?.valor ?? aluno.valorMensal ?? Number(config.valorMensalPadrao || 0),
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
    } catch (error: any) {
      mostrarErro(
        "Erro ao salvar dados financeiros",
        error,
        "Não foi possível salvar os dados financeiros. Tente novamente."
      );
    }
  }


  // =====================================================
  // VAN
  // =====================================================

  async function buscarVan() {
    try {
      const snap = await getDoc(
        doc(db, "configuracoes", "van")
      );

      if (snap.exists()) {
        setVan(snap.data() as Van);
      }
    } catch (error: any) {
      mostrarErro(
        "Erro ao carregar van",
        error,
        "Não foi possível carregar os dados da van."
      );
    }
  }

  async function salvarVan() {
    if (!van.modelo.trim()) {
      Alert.alert(
        "Modelo obrigatório",
        "Informe o modelo da van."
      );
      return;
    }

    try {
      await setDoc(
        doc(db, "configuracoes", "van"),
        {
          ...van,
          atualizadoEm: serverTimestamp(),
        },
        { merge: true }
      );

      await registrarLog(
        "Dados da van atualizados",
        van.modelo
      );

      Alert.alert(
        "Salvo",
        "Dados da van atualizados com sucesso."
      );
    } catch (error: any) {
      mostrarErro(
        "Erro ao salvar van",
        error,
        "Não foi possível salvar os dados da van."
      );
    }
  }

  // =====================================================
  // AVISOS
  // =====================================================

  async function buscarAvisos() {
    try {
      const resposta = await getDocs(
        collection(db, "avisos")
      );

      const lista = resposta.docs.map((item) => ({
        id: item.id,
        ...(item.data() as Omit<Aviso, "id">),
      }));

      setAvisos(lista.reverse());
    } catch (error: any) {
      mostrarErro(
        "Erro ao carregar avisos",
        error,
        "Não foi possível carregar os avisos."
      );
    }
  }

  async function criarAviso() {
    if (!tituloAviso.trim()) {
      Alert.alert(
        "Título obrigatório",
        "Digite um título para o aviso."
      );
      return;
    }

    if (!mensagemAviso.trim()) {
      Alert.alert(
        "Mensagem obrigatória",
        "Digite a mensagem do aviso."
      );
      return;
    }

    try {
      await addDoc(collection(db, "avisos"), {
        titulo: tituloAviso.trim(),
        mensagem: mensagemAviso.trim(),
        criadoEm: serverTimestamp(),
      });

      await registrarLog(
        "Aviso criado",
        tituloAviso.trim()
      );

      setTituloAviso("");
      setMensagemAviso("");

      await buscarAvisos();

      Alert.alert(
        "Aviso publicado",
        "O aviso foi publicado com sucesso."
      );
    } catch (error: any) {
      mostrarErro(
        "Erro ao publicar aviso",
        error,
        "Não foi possível publicar o aviso."
      );
    }
  }

  // =====================================================
  // CONFIGURAÇÕES
  // =====================================================

  async function buscarConfiguracoes() {
    try {
      const snap = await getDoc(
        doc(db, "configuracoes", "geral")
      );

      if (snap.exists()) {
        const dados = snap.data();

        setConfig({
          escolas: dados.escolas || [],
          bairros: dados.bairros || [],
          valorMensalPadrao: dados.valorMensalPadrao || "",
          telefoneContato: dados.telefoneContato || "",
        });
      }
    } catch (error: any) {
      mostrarErro(
        "Erro ao carregar configurações",
        error,
        "Não foi possível carregar as configurações."
      );
    }
  }

  async function salvarConfiguracoes(
    novoConfig: Configuracoes
  ) {
    try {
      setConfig(novoConfig);

      await setDoc(
        doc(db, "configuracoes", "geral"),
        {
          ...novoConfig,
          atualizadoEm: serverTimestamp(),
        },
        { merge: true }
      );

      Alert.alert(
        "Configurações salvas",
        "As informações foram atualizadas com sucesso."
      );
    } catch (error: any) {
      mostrarErro(
        "Erro ao salvar configurações",
        error,
        "Não foi possível salvar as configurações."
      );
    }
  }

  async function adicionarEscola() {
    const escolaLimpa = novaEscola.trim();

    if (!escolaLimpa) {
      Alert.alert(
        "Escola obrigatória",
        "Digite o nome da escola."
      );
      return;
    }

    if (
      config.escolas.some(
        (item) =>
          item.toLowerCase() === escolaLimpa.toLowerCase()
      )
    ) {
      Alert.alert(
        "Escola já cadastrada",
        "Essa escola já está na lista."
      );
      return;
    }

    const novo = {
      ...config,
      escolas: [...config.escolas, escolaLimpa],
    };

    setNovaEscola("");
    await salvarConfiguracoes(novo);
  }

  async function adicionarBairro() {
    const bairroLimpo = novoBairro.trim();

    if (!bairroLimpo) {
      Alert.alert(
        "Bairro obrigatório",
        "Digite o nome do bairro."
      );
      return;
    }

    if (
      config.bairros.some(
        (item) =>
          item.toLowerCase() === bairroLimpo.toLowerCase()
      )
    ) {
      Alert.alert(
        "Bairro já cadastrado",
        "Esse bairro já está na lista."
      );
      return;
    }

    const novo = {
      ...config,
      bairros: [...config.bairros, bairroLimpo],
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


async function buscarLogs() {
  try {
    setCarregandoLogs(true);

    const resposta = await getDocs(collection(db, "logs"));

    const lista = resposta.docs
      .map((item) => ({
        id: item.id,
        ...(item.data() as Omit<LogSistema, "id">),
      }))
      .sort((a, b) => {
        const ta = a.criadoEm?.toMillis?.() || 0;
        const tb = b.criadoEm?.toMillis?.() || 0;
        return tb - ta;
      });

    setLogsSistema(lista);
  } catch (error: any) {
    mostrarErro(
      "Erro ao carregar atividades",
      error,
      "Não foi possível carregar o histórico de atividades."
    );
  } finally {
    setCarregandoLogs(false);
  }
}

function exportarBackupCompleto() {
  if (Platform.OS !== "web") {
    Alert.alert(
      "Backup",
      "O backup em JSON está disponível na versão web."
    );
    return;
  }

  const backup = {
    exportadoEm: new Date().toISOString(),
    alunos,
    pagamentos,
    avisos,
    configuracoes: config,
    van,
    logs: logsSistema,
  };

  const g: any = globalThis as any;
  const blob = new g.Blob(
    [JSON.stringify(backup, null, 2)],
    { type: "application/json;charset=utf-8;" }
  );

  const url = g.URL.createObjectURL(blob);
  const a = g.document.createElement("a");

  a.href = url;
  a.download = `backup-angel-transports-${new Date()
    .toISOString()
    .slice(0, 10)}.json`;
  a.click();

  g.URL.revokeObjectURL(url);
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
      ...alunosAtivos.map((a) => [
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
      ...alunosAtivos.map((aluno) => {
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

  // Informações públicas sincronizadas em tempo real.
  // Se o ADM atualizar Van ou Configurações, a tela pública atualiza.
  useEffect(() => {
    if (
      tela !== "informacoes" &&
      tela !== "inicio"
    ) {
      return;
    }

    const pararVan = onSnapshot(
      doc(db, "configuracoes", "van"),
      (snap) => {
        if (snap.exists()) {
          setVan(snap.data() as Van);
        }
      },
      (error) => {
        console.log(
          "Erro ao sincronizar dados da van:",
          error
        );
      }
    );

    const pararConfig = onSnapshot(
      doc(db, "configuracoes", "geral"),
      (snap) => {
        if (!snap.exists()) return;

        const dados = snap.data();

        setConfig({
          escolas: dados.escolas || [],
          bairros: dados.bairros || [],
          valorMensalPadrao:
            dados.valorMensalPadrao || "",
        });
      },
      (error) => {
        console.log(
          "Erro ao sincronizar configurações:",
          error
        );
      }
    );

    return () => {
      pararVan();
      pararConfig();
    };
  }, [tela]);

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
      buscarLogs();
    }
  }, [tela]);

  useEffect(() => {
    if (
      tela === "admin" &&
      (
        rotaAdmin === "dashboard" ||
        rotaAdmin === "pagamentos" ||
        rotaAdmin === "calendario"
      )
    ) {
      buscarPagamentos();
    }
  }, [
    tela,
    rotaAdmin,
    mesAtual,
    anoAtual,
  ]);

  // =====================================================
  // DADOS CALCULADOS
  // =====================================================

  const solicitacoesPendentes = useMemo(
    () =>
      alunos.filter(
        (aluno) =>
          aluno.statusCadastro === "pendente"
      ),
    [alunos]
  );

  // Cadastros antigos que não possuem status continuam ativos.
  const alunosAtivos = useMemo(
    () =>
      alunos.filter(
        (aluno) =>
          !aluno.statusCadastro ||
          aluno.statusCadastro === "ativo"
      ),
    [alunos]
  );

  const alunosInativos = useMemo(
    () =>
      alunos.filter(
        (aluno) => aluno.statusCadastro === "inativo"
      ),
    [alunos]
  );

  const alunosGerenciaveis = useMemo(
    () =>
      alunos.filter(
        (aluno) =>
          !aluno.statusCadastro ||
          aluno.statusCadastro === "ativo" ||
          aluno.statusCadastro === "inativo"
      ),
    [alunos]
  );

  const alunosFiltrados = useMemo(() => {
    const busca = buscaAluno.trim().toLowerCase();
    const escola = filtroEscola.trim().toLowerCase();
    const bairroFiltro = filtroBairro.trim().toLowerCase();
    const turnoFiltro = filtroTurno.trim().toLowerCase();

    return alunosGerenciaveis.filter((aluno) => {
      const status =
        !aluno.statusCadastro || aluno.statusCadastro === "ativo"
          ? "ativo"
          : aluno.statusCadastro;

      if (filtroStatus !== "todos" && status !== filtroStatus) return false;

      const textoBusca =
        `${aluno.nomeAluno || ""} ${aluno.nomeResponsavel || ""} ${
          aluno.escola || ""
        } ${aluno.bairro || ""}`.toLowerCase();

      if (busca && !textoBusca.includes(busca)) return false;
      if (escola && !(aluno.escola || "").toLowerCase().includes(escola)) return false;
      if (
        bairroFiltro &&
        !(aluno.bairro || "").toLowerCase().includes(bairroFiltro)
      ) return false;
      if (
        turnoFiltro &&
        !(aluno.turno || "").toLowerCase().includes(turnoFiltro)
      ) return false;

      return true;
    });
  }, [
    alunosGerenciaveis,
    buscaAluno,
    filtroStatus,
    filtroEscola,
    filtroBairro,
    filtroTurno,
  ]);

  const totalPago = pagamentos.filter(
    (pagamento) =>
      pagamento.status === "pago" &&
      alunosAtivos.some(
        (aluno) =>
          aluno.id === pagamento.alunoId
      )
  ).length;

  const totalPendente = Math.max(
    alunosAtivos.length - totalPago,
    0
  );

  const totalRecebido = pagamentos
    .filter(
      (pagamento) =>
        pagamento.status === "pago" &&
        alunosAtivos.some(
          (aluno) =>
            aluno.id === pagamento.alunoId
        )
    )
    .reduce(
      (soma, pagamento) =>
        soma + Number(pagamento.valor || 0),
      0
    );

  const vencendo = alunosAtivos.filter(
    (aluno) => {
      const pagamento = pagamentos.find(
        (item) =>
          item.alunoId === aluno.id
      );

      return (
        pagamento?.status !== "pago" &&
        estaVencendoEmSeteDias(
          pagamento?.dataVencimento
        )
      );
    }
  ).length;

  const totalPrevisto = alunosAtivos.reduce(
    (soma, aluno) =>
      soma +
      Number(
        aluno.valorMensal ??
          Number(config.valorMensalPadrao || 0)
      ),
    0
  );

  const totalAtrasados = alunosAtivos.filter((aluno) => {
    const p = pagamentos.find((item) => item.alunoId === aluno.id);
    return p?.status !== "pago" && estaAtrasado(p?.dataVencimento);
  }).length;

  // =====================================================
  // INFORMAÇÕES PÚBLICAS
  // =====================================================

  if (tela === "informacoes") {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.page}>
        <HeaderPagina
          titulo="Conheça a Angel Transports"
          subtitulo="Informações atualizadas diretamente pelo nosso painel administrativo."
          voltar={() => setTela("inicio")}
        />

        <View style={styles.card}>
          <Text style={styles.secaoTituloSemMargem}>Nossa van</Text>
          <Info titulo="Modelo" valor={van.modelo || "Não informado"} />
          <Info titulo="Ano" valor={van.ano || "Não informado"} />
          <Info titulo="Capacidade" valor={van.capacidade || "Não informada"} />
          <Info titulo="Observações" valor={van.observacoes || "Sem observações"} />
        </View>

        <View style={styles.card}>
          <Text style={styles.secaoTituloSemMargem}>Escolas atendidas</Text>
          {config.escolas.length === 0 ? (
            <Text style={styles.descricao}>Nenhuma escola informada no momento.</Text>
          ) : (
            <View style={styles.chips}>
              {config.escolas.map((item, index) => (
                <View key={`${item}-${index}`} style={styles.chip}>
                  <Text style={styles.chipText}>{item}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.secaoTituloSemMargem}>Bairros atendidos</Text>
          {config.bairros.length === 0 ? (
            <Text style={styles.descricao}>Nenhum bairro informado no momento.</Text>
          ) : (
            <View style={styles.chips}>
              {config.bairros.map((item, index) => (
                <View key={`${item}-${index}`} style={styles.chip}>
                  <Text style={styles.chipText}>{item}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.secaoTituloSemMargem}>Fale com a Angel Transports</Text>
          <Text style={styles.descricao}>
            Quer saber sobre disponibilidade, bairros atendidos ou valores? Entre em contato.
          </Text>

          <BotaoAnimado
            texto="Quero contratar o transporte"
            onPress={() =>
              abrirWhatsApp(
                config.telefoneContato,
                "Olá! Tenho interesse no transporte escolar da Angel Transports."
              )
            }
          />
        </View>

        <BotaoAnimado
          texto="Voltar para entrar ou criar conta"
          onPress={() => setTela("inicio")}
        />
      </ScrollView>
    );
  }

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

              <View
  style={{
    width: "100%",
    transform: [{ translateY: -25 }],
  }}
>
  <BotaoAnimado
    texto="Informações do transporte"
    secundario
    hoverLift
    onPress={() => setTela("informacoes")}
  />
</View>

<View style={styles.tabs}>
  <TouchableOpacity
    style={[styles.tab, modo === "login" && styles.tabAtiva]}
    onPress={() => {
      setModo("login");
      setErroLogin("");
    }}
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
    onPress={() => {
      setModo("criar");
      setErroLogin("");
    }}
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
                onChangeText={(texto) => {
                  setSenha(texto);
                  setErroLogin("");
                }}
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

              {modo === "login" && erroLogin !== "" && (
                <View style={styles.erroBox}>
                  <Text style={styles.erroTexto}>
                    ⚠ {erroLogin}
                  </Text>
                </View>
              )}

              <BotaoAnimado
                texto={
                  modo === "login" ? "Entrar no sistema" : "Criar minha conta"
                }
                carregando={carregando}
                onPress={modo === "login" ? fazerLogin : criarConta}
              />

              {modo === "login" && (
                <TouchableOpacity
                  style={styles.linkButton}
                  onPress={recuperarSenha}
                >
                  <Text style={styles.linkText}>Esqueci minha senha</Text>
                </TouchableOpacity>
              )}
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
          subtitulo="Veja seus alunos, situação de cadastro, pagamentos e segurança da conta."
          voltar={() => setTela("menu")}
        />

        {carregandoPerfil ? (
          <ActivityIndicator size="large" color={VINHO} />
        ) : meusAlunos.length === 0 ? (
          <Vazio texto="Nenhuma criança cadastrada." />
        ) : (
          meusAlunos.map((aluno, index) => {
            const historico = pagamentosPerfil
              .filter((p) => p.alunoId === aluno.id)
              .sort((a, b) => b.ano - a.ano || b.mes - a.mes);

            const atual = historico.find(
              (p) => p.mes === mesAtual && p.ano === anoAtual
            );

            return (
              <CardAnimado key={aluno.id} delay={index * 80}>
                <AlunoCard aluno={aluno} />

                <View style={styles.perfilFinanceiro}>
                  <Text style={styles.miniTitulo}>Situação deste mês</Text>
                  <Text
                    style={[
                      styles.statusPerfil,
                      {
                        color:
                          atual?.status === "pago"
                            ? VERDE
                            : VERMELHO,
                      },
                    ]}
                  >
                    {atual?.status === "pago"
                      ? "Pagamento confirmado"
                      : "Pagamento pendente"}
                  </Text>

                  {atual?.dataVencimento && (
                    <Text style={styles.textoSecundario}>
                      Vencimento: {atual.dataVencimento}
                    </Text>
                  )}

                  <Text style={styles.miniTitulo}>Histórico recente</Text>

                  {historico.length === 0 ? (
                    <Text style={styles.textoSecundario}>
                      Nenhum pagamento registrado ainda.
                    </Text>
                  ) : (
                    historico.slice(0, 6).map((p) => (
                      <View key={p.id} style={styles.historicoLinha}>
                        <Text style={styles.historicoMes}>
                          {nomeMes(p.mes)} / {p.ano}
                        </Text>
                        <Text
                          style={{
                            color:
                              p.status === "pago"
                                ? VERDE
                                : VERMELHO,
                            fontWeight: "900",
                          }}
                        >
                          {p.status === "pago" ? "PAGO" : "PENDENTE"}
                        </Text>
                      </View>
                    ))
                  )}
                </View>
              </CardAnimado>
            );
          })
        )}

        <View style={styles.card}>
          <Text style={styles.secaoTituloSemMargem}>Segurança da conta</Text>

          <Campo
            label="Nova senha"
            value={novaSenhaPerfil}
            onChange={setNovaSenhaPerfil}
            placeholder="Mínimo de 6 caracteres"
          />

          <BotaoAnimado
            texto="Trocar minha senha"
            onPress={trocarSenhaAtual}
          />

          <Text style={styles.textoSecundario}>
            Para encerrar sessões de outros dispositivos de forma segura, é necessário um backend administrativo. A sessão deste dispositivo pode ser encerrada pelo botão Sair.
          </Text>
        </View>

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

          <Text style={styles.sucessoTitle}>Cadastro enviado!</Text>

          <Text style={styles.centerText}>
            {nomeAluno} foi cadastrado e enviado para análise. O administrador precisa
            aprovar o cadastro antes de ele entrar na lista de alunos ativos.
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
          texto={`Solicitações (${solicitacoesPendentes.length})`}
          ativo={rotaAdmin === "solicitacoes"}
          onPress={() => setRotaAdmin("solicitacoes")}
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
          texto="Atividades"
          ativo={rotaAdmin === "atividades"}
          onPress={() => {
            setRotaAdmin("atividades");
            buscarLogs();
          }}
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
            <ResumoCard titulo="Alunos ativos" valor={String(alunosAtivos.length)} />
            <ResumoCard
              titulo="Alunos inativos"
              valor={String(alunosInativos.length)}
            />
            <ResumoCard
              titulo="Novas solicitações"
              valor={String(solicitacoesPendentes.length)}
            />
            <ResumoCard titulo="Pagos" valor={String(totalPago)} verde />
            <ResumoCard
              titulo="Pendentes"
              valor={String(totalPendente)}
              vermelho
            />
            <ResumoCard titulo="Vencem em breve" valor={String(vencendo)} />
            <ResumoCard
              titulo="Recebido no mês"
              valor={`R$ ${totalRecebido.toFixed(2).replace(".", ",")}`}
              verde
            />
            <ResumoCard
              titulo="Atrasados"
              valor={String(totalAtrasados)}
              vermelho
            />
            <ResumoCard
              titulo="Previsto no mês"
              valor={`R$ ${totalPrevisto.toFixed(2).replace(".", ",")}`}
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.secaoTituloSemMargem}>Situação financeira</Text>

            <BarraResumo
              titulo="Pagos"
              valor={totalPago}
              total={Math.max(alunosAtivos.length, 1)}
              tipo="verde"
            />

            <BarraResumo
              titulo="Pendentes"
              valor={totalPendente}
              total={Math.max(alunosAtivos.length, 1)}
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

      {/* SOLICITAÇÕES */}

      {rotaAdmin === "solicitacoes" && (
        <>
          <View style={styles.card}>
            <Text style={styles.secaoTituloSemMargem}>Novos cadastros</Text>
            <Text style={styles.descricao}>
              Os alunos cadastrados por novos responsáveis ficam aqui até você aprovar.
              Somente os aprovados entram na lista de alunos ativos e nos pagamentos.
            </Text>
          </View>

          {solicitacoesPendentes.length === 0 ? (
            <Vazio texto="Nenhuma solicitação pendente." />
          ) : (
            solicitacoesPendentes.map((aluno, index) => (
              <CardAnimado key={aluno.id} delay={index * 55}>
                <View style={styles.solicitacaoCard}>
                  <AlunoCard aluno={aluno} />

                  <View style={styles.solicitacaoAcoes}>
                    <TouchableOpacity
                      style={styles.recusarButton}
                      onPress={() => recusarAluno(aluno)}
                    >
                      <Text style={styles.recusarButtonText}>Recusar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.aprovarButton}
                      onPress={() => aprovarAluno(aluno)}
                    >
                      <Text style={styles.aprovarButtonText}>Aprovar aluno</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </CardAnimado>
            ))
          )}
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

            <TouchableOpacity
              style={[
                styles.filtroButton,
                filtroStatus === "todos" && styles.filtroButtonAtivo,
              ]}
              onPress={() => setFiltroStatus("todos")}
            >
              <Text style={styles.filtroButtonText}>Todos</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filtroButton,
                filtroStatus === "ativo" && styles.filtroButtonAtivo,
              ]}
              onPress={() => setFiltroStatus("ativo")}
            >
              <Text style={styles.filtroButtonText}>Ativos</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filtroButton,
                filtroStatus === "inativo" && styles.filtroButtonAtivo,
              ]}
              onPress={() => setFiltroStatus("inativo")}
            >
              <Text style={styles.filtroButtonText}>Inativos</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.exportarButton}
              onPress={exportarAlunos}
            >
              <Text style={styles.exportarButtonText}>Exportar CSV</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.filtrosGrid}>
            <TextInput
              style={[styles.input, styles.filtroInput]}
              placeholder="Filtrar escola"
              placeholderTextColor="#9C8F92"
              value={filtroEscola}
              onChangeText={setFiltroEscola}
            />
            <TextInput
              style={[styles.input, styles.filtroInput]}
              placeholder="Filtrar bairro"
              placeholderTextColor="#9C8F92"
              value={filtroBairro}
              onChangeText={setFiltroBairro}
            />
            <TextInput
              style={[styles.input, styles.filtroInput]}
              placeholder="Filtrar turno"
              placeholderTextColor="#9C8F92"
              value={filtroTurno}
              onChangeText={setFiltroTurno}
            />
          </View>

          {alunoEditando && (
            <View style={styles.card}>
              <Text style={styles.secaoTituloSemMargem}>
                Editar {alunoEditando.nomeAluno}
              </Text>

              <Campo
                label="Nome"
                value={alunoEditando.nomeAluno || ""}
                onChange={(v) =>
                  setAlunoEditando({ ...alunoEditando, nomeAluno: v })
                }
                placeholder="Nome do aluno"
              />
              <Campo
                label="Responsável"
                value={alunoEditando.nomeResponsavel || ""}
                onChange={(v) =>
                  setAlunoEditando({ ...alunoEditando, nomeResponsavel: v })
                }
                placeholder="Nome do responsável"
              />
              <Campo
                label="Telefone"
                value={alunoEditando.telefone || ""}
                onChange={(v) =>
                  setAlunoEditando({ ...alunoEditando, telefone: v })
                }
                placeholder="Telefone"
              />
              <Campo
                label="Bairro"
                value={alunoEditando.bairro || ""}
                onChange={(v) =>
                  setAlunoEditando({ ...alunoEditando, bairro: v })
                }
                placeholder="Bairro"
              />
              <Campo
                label="Escola"
                value={alunoEditando.escola || ""}
                onChange={(v) =>
                  setAlunoEditando({ ...alunoEditando, escola: v })
                }
                placeholder="Escola"
              />
              <Campo
                label="Turno"
                value={alunoEditando.turno || ""}
                onChange={(v) =>
                  setAlunoEditando({ ...alunoEditando, turno: v })
                }
                placeholder="Turno"
              />
              <Campo
                label="Mensalidade individual"
                value={String(alunoEditando.valorMensal ?? "")}
                onChange={(v) =>
                  setAlunoEditando({
                    ...alunoEditando,
                    valorMensal: Number(v.replace(",", ".") || 0),
                  })
                }
                placeholder="Ex: 250"
              />
              <Campo
                label="Dia de vencimento mensal"
                value={String(alunoEditando.diaVencimento ?? "")}
                onChange={(v) =>
                  setAlunoEditando({
                    ...alunoEditando,
                    diaVencimento: Math.min(31, Math.max(1, Number(v || 10))),
                  })
                }
                placeholder="Ex: 10"
              />
              <Campo
                label="Observações internas"
                value={alunoEditando.observacoesInternas || ""}
                onChange={(v) =>
                  setAlunoEditando({
                    ...alunoEditando,
                    observacoesInternas: v,
                  })
                }
                placeholder="Observações do ADM"
              />

              <View style={styles.acoesLinha}>
                <BotaoAnimado
                  texto="Salvar alterações"
                  onPress={salvarEdicaoAluno}
                />
                <BotaoAnimado
                  texto="Cancelar"
                  secundario
                  onPress={() => setAlunoEditando(null)}
                />
              </View>
            </View>
          )}

          {alunoSelecionado && (
            <View style={styles.card}>
              <Text style={styles.secaoTituloSemMargem}>
                Detalhes de {alunoSelecionado.nomeAluno}
              </Text>

              <View style={styles.infoGrade}>
                <Info titulo="Responsável" valor={alunoSelecionado.nomeResponsavel} />
                <Info titulo="Telefone" valor={alunoSelecionado.telefone} />
                <Info titulo="Escola" valor={alunoSelecionado.escola} />
                <Info titulo="Bairro" valor={alunoSelecionado.bairro} />
                <Info titulo="Turno" valor={alunoSelecionado.turno} />
                <Info
                  titulo="Mensalidade"
                  valor={`R$ ${Number(
                    alunoSelecionado.valorMensal ??
                      Number(config.valorMensalPadrao || 0)
                  )
                    .toFixed(2)
                    .replace(".", ",")}`}
                />
                <Info
                  titulo="Vencimento mensal"
                  valor={`Dia ${alunoSelecionado.diaVencimento || 10}`}
                />
              </View>

              <Text style={styles.secaoTitulo}>Histórico de pagamentos</Text>

              {historicoSelecionado.length === 0 ? (
                <Text style={styles.textoSecundario}>
                  Nenhum pagamento registrado.
                </Text>
              ) : (
                historicoSelecionado.map((p) => (
                  <View key={p.id} style={styles.historicoLinha}>
                    <Text style={styles.historicoMes}>
                      {nomeMes(p.mes)} / {p.ano}
                    </Text>
                    <Text
                      style={{
                        color: p.status === "pago" ? VERDE : VERMELHO,
                        fontWeight: "900",
                      }}
                    >
                      {p.status === "pago"
                        ? `PAGO • R$ ${Number(p.valor || 0)
                            .toFixed(2)
                            .replace(".", ",")}`
                        : "PENDENTE"}
                    </Text>
                  </View>
                ))
              )}

              <BotaoAnimado
                texto="Fechar detalhes"
                secundario
                onPress={() => setAlunoSelecionado(null)}
              />
            </View>
          )}

          {carregandoAlunos ? (
            <ActivityIndicator size="large" color={VINHO} />
          ) : alunosFiltrados.length === 0 ? (
            <Vazio texto="Nenhum aluno encontrado com esses filtros." />
          ) : (
            alunosFiltrados.map((aluno, index) => {
              const ativo =
                !aluno.statusCadastro ||
                aluno.statusCadastro === "ativo";

              return (
                <CardAnimado key={aluno.id} delay={index * 55}>
                  <AlunoCard aluno={aluno} />

                  <View style={styles.acoesAluno}>
                    <TouchableOpacity
                      style={styles.acaoNeutra}
                      onPress={() => verDetalhesAluno(aluno)}
                    >
                      <Text style={styles.acaoNeutraText}>Detalhes</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.acaoNeutra}
                      onPress={() => setAlunoEditando({ ...aluno })}
                    >
                      <Text style={styles.acaoNeutraText}>Editar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.acaoWhats}
                      onPress={() =>
                        abrirWhatsApp(
                          aluno.telefone,
                          `Olá ${aluno.nomeResponsavel || ""}! Aqui é da Angel Transports.`
                        )
                      }
                    >
                      <Text style={styles.acaoWhatsText}>WhatsApp</Text>
                    </TouchableOpacity>

                    <View style={styles.statusSwitch}>
                      <Text style={styles.textoSecundario}>
                        {ativo ? "Ativo" : "Inativo"}
                      </Text>
                      <Switch
                        value={ativo}
                        onValueChange={() => alternarStatusAluno(aluno)}
                        trackColor={{ false: "#E7A9B2", true: "#98D5A9" }}
                        thumbColor={ativo ? VERDE : VERMELHO}
                      />
                    </View>

                    <TouchableOpacity
                      style={styles.acaoExcluir}
                      onPress={() => excluirAluno(aluno)}
                    >
                      <Text style={styles.acaoExcluirText}>Excluir</Text>
                    </TouchableOpacity>
                  </View>
                </CardAnimado>
              );
            })
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
            alunosAtivos.map((aluno, index) => {
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


      {/* ATIVIDADES */}

      {rotaAdmin === "atividades" && (
        <>
          <View style={styles.toolbar}>
            <Text style={styles.pagamentoExplicacao}>
              Histórico das principais ações realizadas no sistema.
            </Text>

            <TouchableOpacity
              style={styles.exportarButton}
              onPress={exportarBackupCompleto}
            >
              <Text style={styles.exportarButtonText}>Backup JSON</Text>
            </TouchableOpacity>
          </View>

          {carregandoLogs ? (
            <ActivityIndicator size="large" color={VINHO} />
          ) : logsSistema.length === 0 ? (
            <Vazio texto="Nenhuma atividade registrada." />
          ) : (
            logsSistema.map((log) => (
              <View key={log.id} style={styles.logCard}>
                <Text style={styles.logAcao}>
                  {log.acao || "Atividade"}
                </Text>
                <Text style={styles.logDetalhes}>
                  {log.detalhes || "Sem detalhes"}
                </Text>
                <Text style={styles.logMeta}>
                  {log.adminEmail || "Sistema"} • {formatarTimestamp(log.criadoEm)}
                </Text>
              </View>
            ))
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

            <Campo
              label="WhatsApp / telefone público"
              value={config.telefoneContato || ""}
              onChange={(texto) =>
                setConfig({ ...config, telefoneContato: texto })
              }
              placeholder="Ex: (19) 99999-9999"
            />

            <BotaoAnimado
              texto="Salvar telefone público"
              secundario
              onPress={() => salvarConfiguracoes(config)}
            />

            <BotaoAnimado
              texto="Baixar backup completo"
              secundario
              onPress={exportarBackupCompleto}
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
  hoverLift = false,
}: {
  texto: string;
  onPress: () => void;
  secundario?: boolean;
  carregando?: boolean;
  hoverLift?: boolean;
}) {
  const escala = useRef(new Animated.Value(1)).current;
  const levantar = useRef(new Animated.Value(0)).current;

  function animarHover(valor: number) {
    if (!hoverLift) return;

    Animated.spring(levantar, {
      toValue: valor,
      useNativeDriver: true,
      speed: 18,
      bounciness: 5,
    }).start();
  }

  return (
    <Animated.View
      style={{
        width: "100%",
        transform: [
          { scale: escala },
          { translateY: levantar },
        ],
      }}
    >
      <Pressable
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
        onHoverIn={() => animarHover(-10)}
        onHoverOut={() => animarHover(0)}
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
      </Pressable>
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
  const vencimentoPadrao = pagamento?.dataVencimento || gerarVencimentoMensal(
    aluno.diaVencimento || 10
  );

  const [data, setData] = useState(vencimentoPadrao);
  const [valor, setValor] = useState(
    String(pagamento?.valor ?? aluno.valorMensal ?? valorPadrao ?? "")
  );
  const [observacao, setObservacao] = useState(pagamento?.observacao || "");

  useEffect(() => {
    setData(
      pagamento?.dataVencimento ||
        gerarVencimentoMensal(aluno.diaVencimento || 10)
    );
    setValor(
      String(pagamento?.valor ?? aluno.valorMensal ?? valorPadrao ?? "")
    );
    setObservacao(pagamento?.observacao || "");
  }, [
    pagamento?.dataVencimento,
    pagamento?.valor,
    pagamento?.observacao,
    valorPadrao,
    aluno.valorMensal,
    aluno.diaVencimento,
  ]);

  const pago = pagamento?.status === "pago";
  const atrasado = !pago && estaAtrasado(data);

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

      {atrasado && (
        <View style={styles.atrasoBox}>
          <Text style={styles.atrasoTexto}>Pagamento em atraso</Text>
        </View>
      )}

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

          {aluno.statusCadastro && (
            <View
              style={[
                styles.statusCadastroBadge,
                aluno.statusCadastro === "pendente" &&
                  styles.statusCadastroPendente,
                aluno.statusCadastro === "ativo" &&
                  styles.statusCadastroAtivo,
                aluno.statusCadastro === "inativo" &&
                  styles.statusCadastroInativo,
                aluno.statusCadastro === "recusado" &&
                  styles.statusCadastroRecusado,
              ]}
            >
              <Text
                style={[
                  styles.statusCadastroText,
                  aluno.statusCadastro === "pendente" && { color: AMARELO },
                  aluno.statusCadastro === "ativo" && { color: VERDE },
                  aluno.statusCadastro === "inativo" && { color: "#6B7280" },
                  aluno.statusCadastro === "recusado" && { color: VERMELHO },
                ]}
              >
                {aluno.statusCadastro === "pendente"
                  ? "AGUARDANDO APROVAÇÃO"
                  : aluno.statusCadastro === "ativo"
                  ? "ATIVO"
                  : aluno.statusCadastro === "inativo"
                  ? "INATIVO"
                  : "CADASTRO RECUSADO"}
              </Text>
            </View>
          )}
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

function nomeMes(mes: number) {
  return [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ][Math.max(0, Math.min(11, mes - 1))];
}

function gerarVencimentoMensal(dia: number) {
  const agora = new Date();
  const ultimoDia = new Date(
    agora.getFullYear(),
    agora.getMonth() + 1,
    0
  ).getDate();

  const diaValido = Math.min(
    Math.max(Number(dia || 10), 1),
    ultimoDia
  );

  return `${String(diaValido).padStart(2, "0")}/${String(
    agora.getMonth() + 1
  ).padStart(2, "0")}/${agora.getFullYear()}`;
}

function estaAtrasado(data?: string) {
  if (!data) return false;

  const partes = data.split("/");
  if (partes.length !== 3) return false;

  const [dia, mes, ano] = partes.map(Number);
  const vencimento = new Date(ano, mes - 1, dia);

  if (Number.isNaN(vencimento.getTime())) return false;

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  vencimento.setHours(0, 0, 0, 0);

  return vencimento.getTime() < hoje.getTime();
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
  statusCadastroInativo: {
    backgroundColor: "#EEF0F3",
  },

  filtrosGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20,
  },

  filtroInput: {
    flex: 1,
    minWidth: 190,
    marginBottom: 0,
  },

  filtroButton: {
    minHeight: 50,
    paddingHorizontal: 16,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E5D7DC",
  },

  filtroButtonAtivo: {
    backgroundColor: "#F2E5E9",
    borderColor: VINHO,
  },

  filtroButtonText: {
    color: VINHO,
    fontSize: 12,
    fontWeight: "900",
  },

  acoesAluno: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: -4,
    marginBottom: 18,
    paddingHorizontal: 8,
  },

  acaoNeutra: {
    paddingVertical: 11,
    paddingHorizontal: 15,
    borderRadius: 13,
    backgroundColor: "#F5EEF1",
    borderWidth: 1,
    borderColor: "#E7D7DD",
  },

  acaoNeutraText: {
    color: VINHO,
    fontWeight: "900",
    fontSize: 12,
  },

  acaoWhats: {
    paddingVertical: 11,
    paddingHorizontal: 15,
    borderRadius: 13,
    backgroundColor: "#EAF8EF",
    borderWidth: 1,
    borderColor: "#BFE5CB",
  },

  acaoWhatsText: {
    color: VERDE,
    fontWeight: "900",
    fontSize: 12,
  },

  acaoExcluir: {
    paddingVertical: 11,
    paddingHorizontal: 15,
    borderRadius: 13,
    backgroundColor: "#FFF0F2",
    borderWidth: 1,
    borderColor: "#E7A9B2",
  },

  acaoExcluirText: {
    color: VERMELHO,
    fontWeight: "900",
    fontSize: 12,
  },

  statusSwitch: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 10,
  },

  acoesLinha: {
    gap: 2,
  },

  perfilFinanceiro: {
    backgroundColor: "#FBF7F8",
    borderWidth: 1,
    borderColor: "#EADDE1",
    borderRadius: 18,
    padding: 18,
    marginTop: 4,
    marginBottom: 18,
  },

  miniTitulo: {
    color: VINHO_ESCURO,
    fontWeight: "900",
    fontSize: 13,
    marginTop: 6,
    marginBottom: 8,
  },

  statusPerfil: {
    fontSize: 15,
    fontWeight: "900",
    marginBottom: 5,
  },

  textoSecundario: {
    color: "#7D7075",
    fontSize: 12,
    lineHeight: 18,
    marginTop: 6,
    marginBottom: 8,
  },

  historicoLinha: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: "#EDE3E6",
    paddingVertical: 12,
  },

  historicoMes: {
    color: "#453A3E",
    fontWeight: "800",
    fontSize: 12,
  },

  logCard: {
    backgroundColor: "#FFF",
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E9DDE1",
    shadowColor: "#43101E",
    shadowOpacity: 0.04,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },

  logAcao: {
    color: VINHO_ESCURO,
    fontWeight: "900",
    fontSize: 15,
  },

  logDetalhes: {
    color: "#685C60",
    fontSize: 13,
    marginTop: 5,
  },

  logMeta: {
    color: "#9A8C91",
    fontSize: 11,
    marginTop: 8,
  },

  atrasoBox: {
    backgroundColor: "#FFF0F2",
    borderWidth: 1,
    borderColor: "#E7A9B2",
    borderRadius: 13,
    padding: 10,
    marginTop: 15,
  },

  atrasoTexto: {
    color: VERMELHO,
    textAlign: "center",
    fontWeight: "900",
    fontSize: 12,
  },

  erroBox: {
    backgroundColor: "#FFF0F3",
    borderWidth: 1,
    borderColor: "#F0A8B5",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 16,
    shadowColor: VERMELHO,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
    ...(Platform.OS === "web"
      ? ({
          boxShadow: "0 10px 30px rgba(184,58,72,0.10)",
        } as any)
      : {}),
  },

  erroTexto: {
    color: "#A52235",
    fontSize: 14,
    fontWeight: "800",
    textAlign: "center",
    lineHeight: 20,
  },

  container: {
    flex: 1,
    backgroundColor: "#F7F2F4",
  },

  content: {
    flexGrow: 1,
    paddingBottom: 56,
  },

  hero: {
    minHeight: 390,
    backgroundColor: VINHO_ESCURO,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    paddingHorizontal: 24,
    paddingVertical: 36,
    borderBottomLeftRadius: 34,
    borderBottomRightRadius: 34,
    shadowColor: VINHO_ESCURO,
    shadowOpacity: 0.2,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
    ...(Platform.OS === "web"
      ? ({
          backgroundImage:
            "linear-gradient(135deg, #2C0710 0%, #4B0D1D 46%, #701B35 100%)",
          boxShadow: "0 24px 70px rgba(55,9,19,0.26)",
        } as any)
      : {}),
  },

  bolhaGrande: {
    position: "absolute",
    width: 500,
    height: 500,
    borderRadius: 250,
    backgroundColor: "#9E3553",
    top: -250,
    right: -150,
    opacity: 0.55,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    ...(Platform.OS === "web"
      ? ({
          filter: "blur(0.2px)",
          boxShadow: "0 0 90px rgba(169,55,88,0.22)",
        } as any)
      : {}),
  },

  bolhaPequena: {
    position: "absolute",
    width: 310,
    height: 310,
    borderRadius: 155,
    backgroundColor: "#C85B79",
    bottom: -170,
    left: -90,
    opacity: 0.38,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  logoImagemContainer: {
    width: 142,
    height: 142,
    marginBottom: 20,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 38,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    shadowColor: "#000",
    shadowOpacity: 0.32,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
    ...(Platform.OS === "web"
      ? ({
          backdropFilter: "blur(16px)",
          boxShadow:
            "0 24px 70px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.14)",
        } as any)
      : {}),
  },

  logoImagem: {
    width: "100%",
    height: "100%",
    borderRadius: 36,
  },

  menuLogoImagemContainer: {
    width: 112,
    height: 112,
    alignSelf: "center",
    marginBottom: 24,
    borderRadius: 30,
    backgroundColor: "#FFF8FA",
    borderWidth: 1,
    borderColor: "#F0DDE3",
    shadowColor: VINHO,
    shadowOpacity: 0.15,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },

  menuLogoImagem: {
    width: "100%",
    height: "100%",
    borderRadius: 28,
  },

  title: {
    color: BRANCO,
    fontSize: 42,
    fontWeight: "900",
    letterSpacing: -0.8,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.24)",
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 14,
  },

  subtitle: {
    color: "#F1DCE2",
    fontSize: 16,
    lineHeight: 24,
    marginTop: 10,
    textAlign: "center",
    maxWidth: 650,
    letterSpacing: 0.15,
  },

  main: {
    width: "100%",
    maxWidth: 820,
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingBottom: 20,
    marginTop: -48,
  },

  card: {
    backgroundColor: "rgba(255,255,255,0.98)",
    borderRadius: 28,
    padding: 28,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#EEDFE4",
    shadowColor: "#3C0C19",
    shadowOpacity: 0.10,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 12 },
    elevation: 7,
    ...(Platform.OS === "web"
      ? ({
          boxShadow: "0 22px 60px rgba(71,18,34,0.10)",
          backdropFilter: "blur(18px)",
        } as any)
      : {}),
  },

  cardGrande: {
    width: "100%",
    maxWidth: 590,
    backgroundColor: "rgba(255,255,255,0.99)",
    borderRadius: 32,
    padding: 34,
    borderWidth: 1,
    borderColor: "#EFDDE3",
    shadowColor: "#3C0C19",
    shadowOpacity: 0.12,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 14 },
    elevation: 9,
    ...(Platform.OS === "web"
      ? ({
          boxShadow: "0 26px 80px rgba(62,15,30,0.13)",
          backdropFilter: "blur(18px)",
        } as any)
      : {}),
  },

  tag: {
    color: VINHO_CLARO,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.8,
    marginBottom: 8,
    textTransform: "uppercase",
  },

  cardTitle: {
    color: VINHO_ESCURO,
    fontSize: 31,
    fontWeight: "900",
    letterSpacing: -0.45,
    marginBottom: 8,
  },

  descricao: {
    color: "#74676B",
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 22,
  },

  tabs: {
    flexDirection: "row",
    backgroundColor: "#F3E9ED",
    padding: 6,
    borderRadius: 18,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#EBDCE1",
    ...(Platform.OS === "web"
      ? ({
          boxShadow: "inset 0 1px 4px rgba(55,9,19,0.04)",
        } as any)
      : {}),
  },

  tab: {
    flex: 1,
    minHeight: 48,
    paddingVertical: 13,
    paddingHorizontal: 10,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 13,
    ...(Platform.OS === "web"
      ? ({
          cursor: "pointer",
          transition: "background-color .18s ease, transform .18s ease",
        } as any)
      : {}),
  },

  tabAtiva: {
    backgroundColor: VINHO,
    shadowColor: VINHO_ESCURO,
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
    ...(Platform.OS === "web"
      ? ({
          boxShadow: "0 8px 20px rgba(105,23,45,0.22)",
        } as any)
      : {}),
  },

  tabText: {
    color: VINHO,
    fontWeight: "800",
    fontSize: 14,
  },

  tabTextAtiva: {
    color: BRANCO,
  },

  label: {
    color: "#3D3336",
    fontWeight: "800",
    fontSize: 13,
    marginBottom: 8,
    letterSpacing: 0.1,
  },

  input: {
    height: 60,
    borderWidth: 1,
    borderColor: "#E0D4D8",
    borderRadius: 16,
    paddingHorizontal: 17,
    backgroundColor: "#FCFAFB",
    marginBottom: 18,
    color: "#251F21",
    fontSize: 15,
    shadowColor: "#3B0A18",
    shadowOpacity: 0.025,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    outlineStyle: "none" as any,
    ...(Platform.OS === "web"
      ? ({
          transition:
            "border-color .18s ease, box-shadow .18s ease, background-color .18s ease",
        } as any)
      : {}),
  },

  textArea: {
    minHeight: 130,
    height: 130,
    paddingTop: 16,
    textAlignVertical: "top",
  },

  botaoPrincipal: {
    width: "100%",
    minHeight: 60,
    borderRadius: 18,
    backgroundColor: VINHO,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    paddingHorizontal: 18,
    shadowColor: VINHO_ESCURO,
    shadowOpacity: 0.24,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
    ...(Platform.OS === "web"
      ? ({
          cursor: "pointer",
          backgroundImage:
            "linear-gradient(135deg, #741A35 0%, #5A1028 100%)",
          boxShadow: "0 14px 30px rgba(105,23,45,0.25)",
          transition: "transform .18s ease, box-shadow .18s ease, filter .18s ease",
        } as any)
      : {}),
  },

  botaoPrincipalTexto: {
    color: BRANCO,
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 0.2,
  },

  botaoSecundario: {
    width: "100%",
    minHeight: 60,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "#8F2948",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
    paddingHorizontal: 18,
    backgroundColor: "#FFFDFE",
    shadowColor: VINHO,
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
    ...(Platform.OS === "web"
      ? ({
          cursor: "pointer",
          boxShadow: "0 9px 24px rgba(105,23,45,0.08)",
          transition: "transform .18s ease, box-shadow .18s ease, background .18s ease",
        } as any)
      : {}),
  },

  botaoSecundarioTexto: {
    color: VINHO,
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 0.15,
  },

  center: {
    flex: 1,
    backgroundColor: FUNDO,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    ...(Platform.OS === "web"
      ? ({
          backgroundImage:
            "radial-gradient(circle at top left, rgba(105,23,45,.07), transparent 32%), radial-gradient(circle at bottom right, rgba(141,41,69,.07), transparent 30%)",
        } as any)
      : {}),
  },

  linkButton: {
    alignItems: "center",
    paddingVertical: 17,
    paddingHorizontal: 14,
    borderRadius: 12,
    ...(Platform.OS === "web"
      ? ({
          cursor: "pointer",
          transition: "opacity .18s ease",
        } as any)
      : {}),
  },

  linkText: {
    color: "#817478",
    fontWeight: "800",
    fontSize: 13,
  },

  centerText: {
    textAlign: "center",
    color: "#706468",
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 18,
  },

  checkCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E7F7EC",
    marginBottom: 22,
    borderWidth: 1,
    borderColor: "#C8EAD2",
    shadowColor: VERDE,
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },

  check: {
    color: VERDE,
    fontSize: 50,
    fontWeight: "900",
  },

  sucessoTitle: {
    color: VINHO_ESCURO,
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: -0.35,
    textAlign: "center",
    marginBottom: 12,
  },

  idBox: {
    backgroundColor: "#FBF7F8",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#EADDE1",
  },

  idLabel: {
    color: "#8D8084",
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  idText: {
    color: VINHO_ESCURO,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 5,
    fontSize: 13,
  },

  page: {
    width: "100%",
    maxWidth: 980,
    alignSelf: "center",
    paddingHorizontal: 22,
    paddingTop: 38,
    paddingBottom: 72,
  },

  pageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 26,
    gap: 16,
  },

  pageTitle: {
    color: VINHO_ESCURO,
    fontSize: 33,
    fontWeight: "900",
    letterSpacing: -0.5,
  },

  pageSubtitulo: {
    color: "#786B6F",
    marginTop: 6,
    fontSize: 14,
    lineHeight: 21,
  },

  sairButton: {
    backgroundColor: "#F2E5E9",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5CDD5",
    ...(Platform.OS === "web"
      ? ({
          cursor: "pointer",
          transition: "transform .18s ease, background .18s ease",
        } as any)
      : {}),
  },

  sairButtonText: {
    color: VINHO,
    fontWeight: "900",
    fontSize: 13,
  },

  alunoCard: {
    backgroundColor: BRANCO,
    padding: 23,
    borderRadius: 24,
    marginBottom: 17,
    borderWidth: 1,
    borderColor: "#EBDDE2",
    shadowColor: "#45101F",
    shadowOpacity: 0.07,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
    ...(Platform.OS === "web"
      ? ({
          boxShadow: "0 14px 38px rgba(69,16,31,0.07)",
          transition: "transform .18s ease, box-shadow .18s ease",
        } as any)
      : {}),
  },

  alunoTopo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 19,
  },

  alunoAvatar: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: "#F2E4E9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
    borderWidth: 1,
    borderColor: "#E7D2D9",
  },

  alunoAvatarText: {
    color: VINHO,
    fontSize: 22,
    fontWeight: "900",
  },

  alunoNome: {
    color: VINHO_ESCURO,
    fontSize: 21,
    fontWeight: "900",
    letterSpacing: -0.2,
  },

  alunoEscola: {
    color: "#85787C",
    fontSize: 12,
    marginTop: 4,
  },

  infoGrade: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 11,
  },

  info: {
    minWidth: 145,
    flexGrow: 1,
    backgroundColor: "#FAF6F8",
    paddingVertical: 12,
    paddingHorizontal: 13,
    borderRadius: 14,
    marginTop: 5,
    borderWidth: 1,
    borderColor: "#EFE4E8",
  },

  infoTitulo: {
    color: "#94868B",
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.55,
  },

  infoValor: {
    color: "#342B2E",
    fontSize: 13,
    fontWeight: "800",
    marginTop: 4,
    lineHeight: 18,
  },

  vazio: {
    backgroundColor: BRANCO,
    padding: 38,
    borderRadius: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E9DDE1",
    shadowColor: "#3C0C19",
    shadowOpacity: 0.05,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },

  vazioText: {
    color: "#776B6F",
    textAlign: "center",
    fontSize: 14,
    lineHeight: 21,
  },

  secaoTitulo: {
    color: VINHO_ESCURO,
    fontSize: 21,
    fontWeight: "900",
    letterSpacing: -0.25,
    marginTop: 26,
    marginBottom: 13,
  },

  secaoTituloSemMargem: {
    color: VINHO_ESCURO,
    fontSize: 21,
    fontWeight: "900",
    letterSpacing: -0.25,
    marginBottom: 19,
  },

  adminPage: {
    width: "100%",
    maxWidth: 1260,
    alignSelf: "center",
    paddingHorizontal: 22,
    paddingTop: 38,
    paddingBottom: 82,
  },

  adminTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
    gap: 14,
  },

  adminTitle: {
    color: VINHO_ESCURO,
    fontSize: 35,
    fontWeight: "900",
    letterSpacing: -0.6,
  },

  adminSub: {
    color: "#786B70",
    marginTop: 4,
    fontSize: 14,
  },

  adminTabs: {
    gap: 9,
    paddingBottom: 20,
    paddingHorizontal: 1,
  },

  adminTab: {
    minWidth: 130,
    minHeight: 48,
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    backgroundColor: BRANCO,
    borderWidth: 1,
    borderColor: "#E9DDE1",
    shadowColor: "#3C0C19",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    ...(Platform.OS === "web"
      ? ({
          cursor: "pointer",
          transition: "transform .18s ease, box-shadow .18s ease",
        } as any)
      : {}),
  },

  adminTabAtiva: {
    backgroundColor: VINHO,
    borderColor: VINHO,
    shadowColor: VINHO_ESCURO,
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 7 },
    elevation: 5,
    ...(Platform.OS === "web"
      ? ({
          backgroundImage:
            "linear-gradient(135deg, #741A35 0%, #5B1128 100%)",
          boxShadow: "0 12px 28px rgba(105,23,45,0.22)",
        } as any)
      : {}),
  },

  adminTabTexto: {
    color: VINHO,
    fontWeight: "900",
    fontSize: 13,
  },

  adminTabTextoAtivo: {
    color: BRANCO,
  },

  dashboardGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    marginBottom: 20,
  },

  dashboardCard: {
    flexGrow: 1,
    minWidth: 180,
    backgroundColor: BRANCO,
    borderRadius: 21,
    padding: 21,
    borderWidth: 1,
    borderColor: "#E8DCE0",
    shadowColor: "#45101F",
    shadowOpacity: 0.065,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 7 },
    elevation: 3,
    ...(Platform.OS === "web"
      ? ({
          boxShadow: "0 12px 34px rgba(69,16,31,0.065)",
        } as any)
      : {}),
  },

  dashboardCardVerde: {
    backgroundColor: "#F2FBF5",
    borderColor: "#B9E1C4",
  },

  dashboardCardVermelho: {
    backgroundColor: "#FFF3F5",
    borderColor: "#EDC1C8",
  },

  dashboardCardLabel: {
    color: "#897C80",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.55,
  },

  dashboardCardValor: {
    color: VINHO_ESCURO,
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: -0.4,
    marginTop: 7,
  },

  barraTopo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  barraTitulo: {
    color: "#4B4044",
    fontWeight: "900",
    fontSize: 13,
  },

  barraNumero: {
    color: "#83767A",
    fontWeight: "900",
    fontSize: 12,
  },

  barraFundo: {
    height: 13,
    backgroundColor: "#EEE5E8",
    borderRadius: 99,
    overflow: "hidden",
    marginTop: 9,
    borderWidth: 1,
    borderColor: "#E6DADF",
  },

  barraPreenchida: {
    height: "100%",
    borderRadius: 99,
  },

  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
    flexWrap: "wrap",
  },

  inputBusca: {
    flex: 1,
    minWidth: 270,
    marginBottom: 0,
  },

  exportarButton: {
    backgroundColor: "#F2E5E9",
    paddingHorizontal: 19,
    height: 58,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E4CDD5",
    shadowColor: VINHO,
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    ...(Platform.OS === "web"
      ? ({
          cursor: "pointer",
          transition: "transform .18s ease, background .18s ease",
        } as any)
      : {}),
  },

  exportarButtonText: {
    color: VINHO,
    fontWeight: "900",
    fontSize: 13,
  },

  solicitacaoCard: {
    backgroundColor: "#FFFDF8",
    borderRadius: 24,
    padding: 5,
    marginBottom: 17,
    borderWidth: 1,
    borderColor: "#EAD39A",
    shadowColor: AMARELO,
    shadowOpacity: 0.07,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },

  solicitacaoAcoes: {
    flexDirection: "row",
    gap: 11,
    paddingHorizontal: 15,
    paddingBottom: 15,
    paddingTop: 0,
  },

  aprovarButton: {
    flex: 1,
    backgroundColor: VERDE,
    minHeight: 52,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: VERDE,
    shadowOpacity: 0.16,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
    ...(Platform.OS === "web"
      ? ({
          cursor: "pointer",
          transition: "transform .18s ease, filter .18s ease",
        } as any)
      : {}),
  },

  aprovarButtonText: {
    color: BRANCO,
    fontWeight: "900",
    fontSize: 13,
  },

  recusarButton: {
    flex: 1,
    backgroundColor: "#FCEBED",
    borderWidth: 1,
    borderColor: "#E7A9B2",
    minHeight: 52,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    ...(Platform.OS === "web"
      ? ({
          cursor: "pointer",
          transition: "transform .18s ease, background .18s ease",
        } as any)
      : {}),
  },

  recusarButtonText: {
    color: VERMELHO,
    fontWeight: "900",
    fontSize: 13,
  },

  statusCadastroBadge: {
    alignSelf: "flex-start",
    marginTop: 9,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.035)",
  },

  statusCadastroPendente: {
    backgroundColor: "#FFF3CF",
  },

  statusCadastroAtivo: {
    backgroundColor: "#E3F5E8",
  },

  statusCadastroRecusado: {
    backgroundColor: "#FCE9EC",
  },

  statusCadastroText: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.35,
  },

  pagamentoExplicacao: {
    color: "#706469",
    flex: 1,
    minWidth: 280,
    lineHeight: 20,
  },

  pagamentoCard: {
    borderRadius: 24,
    padding: 23,
    marginBottom: 17,
    borderWidth: 1.5,
    shadowColor: "#40101E",
    shadowOpacity: 0.065,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 7 },
    elevation: 3,
  },

  pagamentoVerde: {
    borderColor: "#9BD2AA",
    backgroundColor: "#F1FAF4",
  },

  pagamentoVermelho: {
    borderColor: "#E9ADB6",
    backgroundColor: "#FFF3F5",
  },

  pagamentoTopo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },

  pagamentoNome: {
    color: VINHO_ESCURO,
    fontSize: 21,
    fontWeight: "900",
    letterSpacing: -0.2,
  },

  pagamentoEscola: {
    color: "#7D7175",
    marginTop: 4,
    fontSize: 12,
  },

  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.035)",
  },

  statusBadgePago: {
    backgroundColor: "#DDF3E4",
  },

  statusBadgeNaoPago: {
    backgroundColor: "#F9DFE3",
  },

  statusBadgeText: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.45,
  },

  switchArea: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 13,
    marginVertical: 23,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.58)",
  },

  statusNaoPago: {
    color: VERMELHO,
    fontWeight: "900",
    fontSize: 13,
  },

  statusPago: {
    color: VERDE,
    fontWeight: "900",
    fontSize: 13,
  },

  statusDesativado: {
    color: "#A19699",
    fontWeight: "800",
    fontSize: 13,
  },

  dataBox: {
    backgroundColor: "#F3EAED",
    padding: 14,
    borderRadius: 14,
    marginTop: 13,
    borderWidth: 1,
    borderColor: "#E8DADF",
  },

  dataBoxLabel: {
    color: "#8D8084",
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.45,
  },

  dataBoxValue: {
    color: VINHO_ESCURO,
    fontWeight: "900",
    marginTop: 4,
  },

  dataPagamentoBox: {
    backgroundColor: "#E6F6EB",
    padding: 14,
    borderRadius: 14,
    marginTop: 11,
    borderWidth: 1,
    borderColor: "#CBE8D3",
  },

  dataPagamentoLabel: {
    color: "#68806F",
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.45,
  },

  dataPagamentoValor: {
    color: VERDE,
    fontWeight: "900",
    marginTop: 4,
  },

  seletorMes: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: BRANCO,
    padding: 14,
    borderRadius: 20,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#E8DCE0",
    shadowColor: "#40101E",
    shadowOpacity: 0.055,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },

  mesButton: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: "#F2E5E9",
    borderWidth: 1,
    borderColor: "#E4CED5",
    alignItems: "center",
    justifyContent: "center",
    ...(Platform.OS === "web"
      ? ({
          cursor: "pointer",
          transition: "transform .18s ease, background .18s ease",
        } as any)
      : {}),
  },

  mesButtonText: {
    color: VINHO,
    fontSize: 29,
    fontWeight: "900",
    lineHeight: 31,
  },

  mesTitulo: {
    color: VINHO_ESCURO,
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: -0.25,
  },

  calendario: {
    backgroundColor: BRANCO,
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: "#E8DCE0",
    shadowColor: "#40101E",
    shadowOpacity: 0.06,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },

  calendarioTitulo: {
    color: VINHO_ESCURO,
    fontSize: 23,
    fontWeight: "900",
    letterSpacing: -0.3,
    marginBottom: 21,
  },

  diasSemana: {
    flexDirection: "row",
    backgroundColor: "#FAF6F8",
    borderRadius: 12,
    paddingVertical: 8,
    marginBottom: 6,
  },

  diaSemana: {
    width: "14.2857%",
    textAlign: "center",
    color: "#877A7E",
    fontWeight: "900",
    fontSize: 11,
  },

  grade: {
    flexDirection: "row",
    flexWrap: "wrap",
    overflow: "hidden",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#EDE3E6",
  },

  dia: {
    width: "14.2857%",
    minHeight: 72,
    borderWidth: 0.5,
    borderColor: "#EEE4E7",
    alignItems: "center",
    padding: 7,
    backgroundColor: "#FFFDFE",
  },

  numeroDia: {
    color: "#3B3134",
    fontWeight: "800",
    fontSize: 12,
  },

  bolinha: {
    minWidth: 25,
    height: 25,
    paddingHorizontal: 6,
    borderRadius: 13,
    backgroundColor: VERDE,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 7,
    shadowColor: VERDE,
    shadowOpacity: 0.13,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },

  bolinhaText: {
    color: BRANCO,
    fontSize: 10,
    fontWeight: "900",
  },

  semPagamento: {
    color: "#8B7F83",
    paddingVertical: 17,
    fontSize: 13,
  },

  pagamentoCalendario: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#EEE4E7",
    paddingVertical: 15,
    gap: 12,
  },

  pagamentoCalendarioNome: {
    color: VINHO_ESCURO,
    fontWeight: "900",
    fontSize: 14,
  },

  pagamentoCalendarioData: {
    color: "#7A6E72",
    fontSize: 12,
    marginTop: 3,
  },

  pagoMiniBadge: {
    backgroundColor: "#E3F5E8",
    color: VERDE,
    fontSize: 10,
    fontWeight: "900",
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 11,
    overflow: "hidden",
  },

  avisoCard: {
    backgroundColor: BRANCO,
    borderRadius: 20,
    padding: 21,
    marginBottom: 13,
    borderWidth: 1,
    borderColor: "#E9DDE1",
    shadowColor: "#43101E",
    shadowOpacity: 0.055,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },

  avisoTitulo: {
    color: VINHO_ESCURO,
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: -0.15,
  },

  avisoMensagem: {
    color: "#6E6266",
    lineHeight: 21,
    marginTop: 8,
    fontSize: 13,
  },

  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
    marginTop: 18,
  },

  chip: {
    backgroundColor: "#F1E5E9",
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: "#E5D0D7",
    ...(Platform.OS === "web"
      ? ({
          boxShadow: "0 5px 14px rgba(105,23,45,0.045)",
        } as any)
      : {}),
  },

  chipText: {
    color: VINHO,
    fontSize: 12,
    fontWeight: "900",
  },
});
import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";

import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

import {
  createUserWithEmailAndPassword,
  getIdTokenResult,
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


const VINHO = "#69172D";
const VINHO_ESCURO = "#370913";
const VINHO_CLARO = "#8D2945";
const FUNDO = "#F6F1F3";
const BRANCO = "#FFFFFF";
const VERDE = "#248A46";
const VERMELHO = "#B83A48";
const AMARELO = "#B7791F";
const TERMOS_VERSAO = "1.1";

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
  | "ajuda"
  | "privacidade"
  | "termosPendentes"
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
  observacoesResponsavel?: string;
  tipoTransporte?: "ida" | "volta" | "ida_volta";
  horarioEmbarque?: string;
  contatoEmergencia?: string;
  statusContrato?: "pendente" | "assinado";
  dataInicioTransporte?: string;
  dataFimTransporte?: string;
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

type AceiteTermos = {
  id: string;
  name?: string;
  email?: string;
  termosVersao?: string;
  termosAceitosEm?: any;
};

type HistoricoAluno = {
  id: string;
  alunoId: string;
  acao: string;
  autorEmail?: string;
  autorUid?: string;
  autorTipo?: "admin" | "responsavel";
  criadoEm?: any;
};

// =====================================================
// APP PRINCIPAL
// =====================================================

export default function HomeScreen() {
  const { width: larguraTela } = useWindowDimensions();
  const mobile = larguraTela <= 600;

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
  const graficoAnim = useRef(new Animated.Value(0)).current;
  const [confirmacao, setConfirmacao] = useState<{
    titulo: string;
    mensagem: string;
    confirmar: () => void;
  } | null>(null);

  useEffect(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(24);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 360,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        speed: 18,
        bounciness: 5,
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
  const [aceitouTermos, setAceitouTermos] = useState(false);
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
  const [tipoTransporte, setTipoTransporte] =
    useState<"ida" | "volta" | "ida_volta">("ida_volta");
  const [contatoEmergencia, setContatoEmergencia] = useState("");
  const [observacoesResponsavel, setObservacoesResponsavel] = useState("");

  // PERFIL
  const [meusAlunos, setMeusAlunos] = useState<Aluno[]>([]);
  const [carregandoPerfil, setCarregandoPerfil] = useState(false);
  const [alunoResponsavelEditando, setAlunoResponsavelEditando] = useState<Aluno | null>(null);

  // PAGAMENTOS
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [pagamentosAno, setPagamentosAno] = useState<Pagamento[]>([]);
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
    useState<"todos" | "ativo" | "inativo" | "pendente" | "recusado">("todos");
  const [filtroEscola, setFiltroEscola] = useState("");
  const [filtroBairro, setFiltroBairro] = useState("");
  const [filtroTurno, setFiltroTurno] = useState("");

  // DETALHES / EDIÇÃO DE ALUNO
  const [alunoSelecionado, setAlunoSelecionado] = useState<Aluno | null>(null);
  const [alunoEditando, setAlunoEditando] = useState<Aluno | null>(null);
  const [historicoSelecionado, setHistoricoSelecionado] = useState<Pagamento[]>([]);
  const [historicoAlunoSelecionado, setHistoricoAlunoSelecionado] =
    useState<HistoricoAluno[]>([]);

  // PERFIL DO RESPONSÁVEL
  const [pagamentosPerfil, setPagamentosPerfil] = useState<Pagamento[]>([]);

  // LOGS
  const [logsSistema, setLogsSistema] = useState<LogSistema[]>([]);
  const [carregandoLogs, setCarregandoLogs] = useState(false);
  const [aceitesTermos, setAceitesTermos] = useState<AceiteTermos[]>([]);
  const [carregandoAceites, setCarregandoAceites] = useState(false);

  // SEGURANÇA
  const [novaSenhaPerfil, setNovaSenhaPerfil] = useState("");

  // STATUS DO SISTEMA
  const [firebaseOnline, setFirebaseOnline] = useState(true);
  const [mensagemSistema, setMensagemSistema] = useState("");
  const [aceiteNovaVersao, setAceiteNovaVersao] = useState(false);
  const [buscaGlobalAdmin, setBuscaGlobalAdmin] = useState("");
  const [graficoTooltip, setGraficoTooltip] = useState<{
    mes: number;
    valor: number;
  } | null>(null);
  const headerScroll = useRef(new Animated.Value(0)).current;

function mostrarSucessoNaTela(mensagem: string) {
  setMensagemSistema(mensagem);

  setTimeout(() => {
    setMensagemSistema((atual) => (atual === mensagem ? "" : atual));
  }, 4000);
}

function telefoneValido(numero?: string) {
  const digitos = (numero || "").replace(/\D/g, "");
  return digitos.length === 10 || digitos.length === 11;
}

async function registrarHistoricoAluno(
  alunoId: string,
  acao: string,
  autorTipo: "admin" | "responsavel"
) {
  try {
    const usuario = auth.currentUser;
    if (!usuario) return;

    await addDoc(collection(db, "historicoAlunos"), {
      alunoId,
      acao,
      autorEmail: usuario.email || "",
      autorUid: usuario.uid,
      autorTipo,
      criadoEm: serverTimestamp(),
    });
  } catch (error) {
    console.log("Não foi possível registrar histórico do aluno:", error);
  }
}

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

    const token = await getIdTokenResult(
      credencial.user,
      true
    );

    const usuarioAdmin = token.claims.admin === true;

    if (usuarioAdmin) {
      setRotaAdmin("dashboard");
      setTela("admin");
      return;
    }

    const perfilSnap = await getDoc(
      doc(db, "users", credencial.user.uid)
    );

    const perfilDados = perfilSnap.exists() ? perfilSnap.data() : null;

    if (
      !perfilDados?.termosAceitos ||
      perfilDados?.termosVersao !== TERMOS_VERSAO
    ) {
      setAceiteNovaVersao(false);
      setTela("termosPendentes");
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

  if (!aceitouTermos) {
    Alert.alert(
      "Aceite necessário",
      "Para criar sua conta, marque que você leu e aceita os Termos de Uso e a Política de Privacidade."
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

          termosAceitos: true,
          termosVersao: TERMOS_VERSAO,
          termosAceitosEm: serverTimestamp(),

          criadoEm:
            serverTimestamp(),
        }
      );

      // Registro separado e permanente do aceite.
      // A regra do Firestore deve impedir update/delete nesta coleção.
      await setDoc(
        doc(db, "aceitesTermos", `${credencial.user.uid}_${TERMOS_VERSAO}`),
        {
          name: nomeLimpo,
          email: credencial.user.email || emailLimpo,
          termosVersao: TERMOS_VERSAO,
          termosAceitosEm: serverTimestamp(),
          userId: credencial.user.uid,
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
    setAceitouTermos(false);

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
  setConfirmacao({
    titulo,
    mensagem,
    confirmar,
  });
}

function normalizarTelefoneBrasil(numero?: string) {
  if (!numero) return "";

  let limpo = numero.replace(/\D/g, "");

  if (limpo.startsWith("0")) {
    limpo = limpo.replace(/^0+/, "");
  }

  if (!limpo.startsWith("55")) {
    limpo = `55${limpo}`;
  }

  return limpo;
}

function abrirWhatsApp(numero?: string, mensagem?: string) {
  const telefone = normalizarTelefoneBrasil(numero);

  if (!telefone) {
    Alert.alert(
      "Telefone não informado",
      "Este responsável não possui telefone cadastrado."
    );
    return;
  }

  const texto = encodeURIComponent(
    mensagem || "Olá! Aqui é da Angel Transports."
  );

  const url = `https://wa.me/${telefone}?text=${texto}`;

  if (Platform.OS === "web") {
    const g: any = globalThis as any;

    if (g.window?.open) {
      g.window.open(url, "_blank", "noopener,noreferrer");
      return;
    }

    if (g.location) {
      g.location.href = url;
      return;
    }
  }

  Linking.openURL(url).catch(() => {
    Alert.alert(
      "Erro",
      "Não foi possível abrir o WhatsApp neste dispositivo."
    );
  });
}

function ligarParaNumero(numero?: string) {
  const telefone = normalizarTelefoneBrasil(numero);

  if (!telefone) {
    Alert.alert(
      "Telefone não informado",
      "O telefone da Angel Transports ainda não foi configurado."
    );
    return;
  }

  // O sinal + deixa o número no padrão internacional brasileiro.
  const url = `tel:+${telefone}`;

  if (Platform.OS === "web") {
    const g: any = globalThis as any;

    // Em navegadores móveis, navegar para tel: abre o discador do aparelho.
    if (g.window?.location) {
      g.window.location.href = url;
      return;
    }

    if (g.location) {
      g.location.href = url;
      return;
    }
  }

  Linking.openURL(url).catch(() => {
    Alert.alert(
      "Não foi possível abrir o telefone",
      "Este dispositivo ou navegador não conseguiu abrir o aplicativo de telefone."
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

    const existentes = await getDocs(
      query(
        collection(db, "alunos"),
        where("usuarioUid", "==", usuario.uid)
      )
    );

    const nomeNormalizado = nomeAluno.trim().toLowerCase();
    const escolaNormalizada = escola.trim().toLowerCase();

    const duplicado = existentes.docs.some((item) => {
      const dados = item.data() as Aluno;

      return (
        (dados.nomeAluno || "").trim().toLowerCase() === nomeNormalizado &&
        (dados.escola || "").trim().toLowerCase() === escolaNormalizada &&
        dados.statusCadastro !== "recusado"
      );
    });

    if (duplicado) {
      Alert.alert(
        "Cadastro já existente",
        "Já existe uma criança com esse nome e escola vinculada à sua conta."
      );
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

          tipoTransporte,
          contatoEmergencia: contatoEmergencia.trim(),
          observacoesResponsavel: observacoesResponsavel.trim(),
          statusContrato: "pendente",

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

    await registrarHistoricoAluno(
      documento.id,
      "Cadastro criado pelo responsável",
      "responsavel"
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


async function salvarEdicaoResponsavel() {
  const usuario = auth.currentUser;

  if (!usuario || !alunoResponsavelEditando) {
    Alert.alert("Sessão expirada", "Entre novamente para editar o cadastro.");
    return;
  }

  // Proteção também no front: o responsável só edita um cadastro vinculado ao próprio UID.
  if (alunoResponsavelEditando.usuarioUid !== usuario.uid) {
    Alert.alert("Acesso negado", "Você só pode editar os seus próprios alunos.");
    setAlunoResponsavelEditando(null);
    return;
  }

  if (!alunoResponsavelEditando.nomeAluno?.trim()) {
    Alert.alert("Nome obrigatório", "Informe o nome da criança.");
    return;
  }

  if (!alunoResponsavelEditando.nomeResponsavel?.trim()) {
    Alert.alert("Responsável obrigatório", "Informe o nome do responsável.");
    return;
  }

  if (!telefoneValido(alunoResponsavelEditando.telefone)) {
    Alert.alert("Telefone inválido", "Digite um telefone válido com DDD.");
    return;
  }

  if (!alunoResponsavelEditando.bairro?.trim()) {
    Alert.alert("Bairro obrigatório", "Informe o bairro.");
    return;
  }

  if (!alunoResponsavelEditando.escola?.trim()) {
    Alert.alert("Escola obrigatória", "Informe a escola.");
    return;
  }

  if (!alunoResponsavelEditando.turno?.trim()) {
    Alert.alert("Turno obrigatório", "Informe o turno.");
    return;
  }

  try {
    setSalvando(true);

    const dadosPermitidos = {
      nomeAluno: alunoResponsavelEditando.nomeAluno?.trim() || "",
      nomeResponsavel: alunoResponsavelEditando.nomeResponsavel?.trim() || "",
      telefone: alunoResponsavelEditando.telefone?.trim() || "",
      bairro: alunoResponsavelEditando.bairro?.trim() || "",
      escola: alunoResponsavelEditando.escola?.trim() || "",
      turno: alunoResponsavelEditando.turno?.trim() || "",
      tipoTransporte: alunoResponsavelEditando.tipoTransporte || "ida_volta",
      contatoEmergencia: alunoResponsavelEditando.contatoEmergencia?.trim() || "",
      observacoesResponsavel:
        alunoResponsavelEditando.observacoesResponsavel?.trim() || "",
      atualizadoEm: serverTimestamp(),
    };

    await setDoc(
      doc(db, "alunos", alunoResponsavelEditando.id),
      dadosPermitidos,
      { merge: true }
    );

    setMeusAlunos((listaAtual) =>
      listaAtual.map((item) =>
        item.id === alunoResponsavelEditando.id
          ? { ...item, ...dadosPermitidos }
          : item
      )
    );

    await registrarHistoricoAluno(
      alunoResponsavelEditando.id,
      "Dados atualizados pelo responsável",
      "responsavel"
    );

    setAlunoResponsavelEditando(null);
    mostrarSucessoNaTela("Dados da criança atualizados com sucesso.");
  } catch (error: any) {
    mostrarErro(
      "Erro ao editar cadastro",
      error,
      "Não foi possível salvar as alterações."
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

async function usuarioEhAdmin() {
  const usuario = auth.currentUser;

  if (!usuario) return false;

  try {
    const token = await getIdTokenResult(usuario, true);
    return token.claims.admin === true;
  } catch {
    return false;
  }
}

async function exigirAdmin() {
  const permitido = await usuarioEhAdmin();

  if (!permitido) {
    Alert.alert(
      "Acesso negado",
      "Esta ação é exclusiva do administrador."
    );
    return false;
  }

  return true;
}



async function aprovarAluno(aluno: Aluno) {
  if (!(await exigirAdmin())) return;

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
    await registrarHistoricoAluno(aluno.id, "Aluno aprovado", "admin");

    // Atualiza só o aluno alterado na tela, sem buscar a lista inteira novamente.
    setAlunos((listaAtual) =>
      listaAtual.map((item) =>
        item.id === aluno.id
          ? {
              ...item,
              statusCadastro: "ativo",
              aprovadoEm: new Date(),
              recusadoEm: null,
            }
          : item
      )
    );

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
  if (!(await exigirAdmin())) return;

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
    await registrarHistoricoAluno(aluno.id, "Cadastro recusado", "admin");

    setAlunos((listaAtual) =>
      listaAtual.map((item) =>
        item.id === aluno.id
          ? {
              ...item,
              statusCadastro: "recusado",
              recusadoEm: new Date(),
            }
          : item
      )
    );

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
  setTipoTransporte("ida_volta");
  setContatoEmergencia("");
  setCadastroId("");
}

async function salvarEdicaoAluno() {
  if (!(await exigirAdmin())) return;
  if (!alunoEditando) return;

  if (!alunoEditando.nomeAluno?.trim()) {
    Alert.alert("Nome obrigatório", "Informe o nome do aluno.");
    return;
  }

  const alunoAtualizado: Aluno = {
    ...alunoEditando,
    nomeAluno: alunoEditando.nomeAluno?.trim() || "",
    nomeResponsavel: alunoEditando.nomeResponsavel?.trim() || "",
    telefone: alunoEditando.telefone?.trim() || "",
    bairro: alunoEditando.bairro?.trim() || "",
    escola: alunoEditando.escola?.trim() || "",
    turno: alunoEditando.turno?.trim() || "",
    valorMensal: Number(alunoEditando.valorMensal || 0),
    diaVencimento: Number(alunoEditando.diaVencimento || 10),
    observacoesInternas: alunoEditando.observacoesInternas || "",
    tipoTransporte: alunoEditando.tipoTransporte || "ida_volta",
    horarioEmbarque: alunoEditando.horarioEmbarque || "",
    contatoEmergencia: alunoEditando.contatoEmergencia || "",
    statusContrato: alunoEditando.statusContrato || "pendente",
    dataInicioTransporte: alunoEditando.dataInicioTransporte || "",
    dataFimTransporte: alunoEditando.dataFimTransporte || "",
  };

  try {
    await setDoc(
      doc(db, "alunos", alunoEditando.id),
      {
        nomeAluno: alunoAtualizado.nomeAluno,
        nomeResponsavel: alunoAtualizado.nomeResponsavel,
        telefone: alunoAtualizado.telefone,
        bairro: alunoAtualizado.bairro,
        escola: alunoAtualizado.escola,
        turno: alunoAtualizado.turno,
        valorMensal: alunoAtualizado.valorMensal,
        diaVencimento: alunoAtualizado.diaVencimento,
        observacoesInternas: alunoAtualizado.observacoesInternas,
        tipoTransporte: alunoAtualizado.tipoTransporte,
        horarioEmbarque: alunoAtualizado.horarioEmbarque,
        contatoEmergencia: alunoAtualizado.contatoEmergencia,
        statusContrato: alunoAtualizado.statusContrato,
        dataInicioTransporte: alunoAtualizado.dataInicioTransporte,
        dataFimTransporte: alunoAtualizado.dataFimTransporte,
        atualizadoEm: serverTimestamp(),
      },
      { merge: true }
    );

    await registrarLog(
      "Aluno editado",
      alunoAtualizado.nomeAluno || alunoAtualizado.id
    );
    await registrarHistoricoAluno(
      alunoAtualizado.id,
      "Dados atualizados pelo administrador",
      "admin"
    );

    setAlunos((listaAtual) =>
      listaAtual.map((item) =>
        item.id === alunoAtualizado.id ? alunoAtualizado : item
      )
    );

    setAlunoSelecionado((atual) =>
      atual?.id === alunoAtualizado.id ? alunoAtualizado : atual
    );

    setAlunoEditando(null);

    mostrarSucessoNaTela("Alterações do aluno salvas com sucesso.");
  } catch (error: any) {
    mostrarErro(
      "Erro ao editar aluno",
      error,
      "Não foi possível salvar as alterações."
    );
  }
}

async function alternarStatusAluno(aluno: Aluno) {
  if (!(await exigirAdmin())) return;

  const ativoAtual =
    !aluno.statusCadastro || aluno.statusCadastro === "ativo";

  const novoStatus: "ativo" | "inativo" =
    ativoAtual ? "inativo" : "ativo";

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
    await registrarHistoricoAluno(
      aluno.id,
      novoStatus === "ativo" ? "Aluno ativado" : "Aluno inativado",
      "admin"
    );

    setAlunos((listaAtual) =>
      listaAtual.map((item) =>
        item.id === aluno.id
          ? { ...item, statusCadastro: novoStatus }
          : item
      )
    );

    setAlunoSelecionado((atual) =>
      atual?.id === aluno.id
        ? { ...atual, statusCadastro: novoStatus }
        : atual
    );
  } catch (error: any) {
    mostrarErro(
      "Erro ao alterar status",
      error,
      "Não foi possível alterar o status do aluno."
    );
  }
}

async function excluirAluno(aluno: Aluno) {
  if (!(await exigirAdmin())) return;

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

        setAlunos((listaAtual) =>
          listaAtual.filter((item) => item.id !== aluno.id)
        );

        setPagamentos((listaAtual) =>
          listaAtual.filter((item) => item.alunoId !== aluno.id)
        );

        setPagamentosAno((listaAtual) =>
          listaAtual.filter((item) => item.alunoId !== aluno.id)
        );

        if (alunoSelecionado?.id === aluno.id) {
          setAlunoSelecionado(null);
        }

        if (alunoEditando?.id === aluno.id) {
          setAlunoEditando(null);
        }

        Alert.alert(
          "Aluno excluído",
          "O cadastro foi excluído."
        );
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

    const respostaHistorico = await getDocs(
      query(
        collection(db, "historicoAlunos"),
        where("alunoId", "==", aluno.id)
      )
    );

    const alteracoes = respostaHistorico.docs
      .map((item) => ({
        id: item.id,
        ...(item.data() as Omit<HistoricoAluno, "id">),
      }))
      .sort((a, b) => {
        const ta = a.criadoEm?.toMillis?.() || 0;
        const tb = b.criadoEm?.toMillis?.() || 0;
        return tb - ta;
      });

    setHistoricoAlunoSelecionado(alteracoes);
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


  async function buscarPagamentosAno() {
    try {
      const consulta = query(
        collection(db, "pagamentos"),
        where("ano", "==", anoAtual)
      );

      const resposta = await getDocs(consulta);

      setPagamentosAno(
        resposta.docs.map((item) => ({
          id: item.id,
          ...(item.data() as Omit<Pagamento, "id">),
        }))
      );
    } catch (error: any) {
      console.log("ERRO PAGAMENTOS ANUAIS", error);
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
    if (!(await exigirAdmin())) return;

    try {
      const idPagamento = `${aluno.id}_${anoAtual}_${mesAtual}`;
      const valorFinal =
        valor ??
        aluno.valorMensal ??
        Number(config.valorMensalPadrao || 0);

      await setDoc(
        doc(db, "pagamentos", idPagamento),
        {
          alunoId: aluno.id,
          nomeAluno: aluno.nomeAluno || "",
          status,
          mes: mesAtual,
          ano: anoAtual,
          valor: valorFinal,
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

      const pagamentoAtualizado: Pagamento = {
        id: idPagamento,
        alunoId: aluno.id,
        nomeAluno: aluno.nomeAluno || "",
        status,
        mes: mesAtual,
        ano: anoAtual,
        valor: valorFinal,
        observacao: observacao || "",
        dataPagamento: status === "pago" ? new Date() : null,
      };

      setPagamentos((listaAtual) => {
        const existe = listaAtual.some((item) => item.id === idPagamento);
        return existe
          ? listaAtual.map((item) =>
              item.id === idPagamento ? pagamentoAtualizado : item
            )
          : [...listaAtual, pagamentoAtualizado];
      });

      setPagamentosAno((listaAtual) => {
        const existe = listaAtual.some((item) => item.id === idPagamento);
        return existe
          ? listaAtual.map((item) =>
              item.id === idPagamento ? pagamentoAtualizado : item
            )
          : [...listaAtual, pagamentoAtualizado];
      });
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
    if (!(await exigirAdmin())) return;

    if (!dataVencimento.trim()) {
      Alert.alert("Atenção", "Digite a data de vencimento.");
      return;
    }

    try {
      const idPagamento = `${aluno.id}_${anoAtual}_${mesAtual}`;
      const existente = pagamentos.find((p) => p.alunoId === aluno.id);

      const pagamentoAtualizado: Pagamento = {
        id: idPagamento,
        alunoId: aluno.id,
        nomeAluno: aluno.nomeAluno || "",
        status: existente?.status || "nao_pago",
        mes: mesAtual,
        ano: anoAtual,
        dataVencimento: dataVencimento.trim(),
        valor:
          valor ??
          existente?.valor ??
          aluno.valorMensal ??
          Number(config.valorMensalPadrao || 0),
        observacao: observacao ?? existente?.observacao ?? "",
        dataPagamento: existente?.dataPagamento,
      };

      await setDoc(
        doc(db, "pagamentos", idPagamento),
        {
          alunoId: pagamentoAtualizado.alunoId,
          nomeAluno: pagamentoAtualizado.nomeAluno,
          status: pagamentoAtualizado.status,
          mes: pagamentoAtualizado.mes,
          ano: pagamentoAtualizado.ano,
          dataVencimento: pagamentoAtualizado.dataVencimento,
          valor: pagamentoAtualizado.valor,
          observacao: pagamentoAtualizado.observacao,
          atualizadoEm: serverTimestamp(),
        },
        { merge: true }
      );

      await registrarLog(
        "Vencimento alterado",
        `${aluno.nomeAluno}: ${dataVencimento}`
      );

      setPagamentos((listaAtual) => {
        const existe = listaAtual.some((item) => item.id === idPagamento);
        return existe
          ? listaAtual.map((item) =>
              item.id === idPagamento ? pagamentoAtualizado : item
            )
          : [...listaAtual, pagamentoAtualizado];
      });

      setPagamentosAno((listaAtual) => {
        const existe = listaAtual.some((item) => item.id === idPagamento);
        return existe
          ? listaAtual.map((item) =>
              item.id === idPagamento ? pagamentoAtualizado : item
            )
          : [...listaAtual, pagamentoAtualizado];
      });

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
  if (!(await exigirAdmin())) return;
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
    if (!(await exigirAdmin())) return;

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
      const tituloNovo = tituloAviso.trim();
      const mensagemNova = mensagemAviso.trim();

      const documento = await addDoc(collection(db, "avisos"), {
        titulo: tituloNovo,
        mensagem: mensagemNova,
        criadoEm: serverTimestamp(),
      });

      await registrarLog(
        "Aviso criado",
        tituloNovo
      );

      setAvisos((listaAtual) => [
        {
          id: documento.id,
          titulo: tituloNovo,
          mensagem: mensagemNova,
          criadoEm: new Date(),
        },
        ...listaAtual,
      ]);

      setTituloAviso("");
      setMensagemAviso("");

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
  // CONFIGURAÇÕES
  // =====================================================


  function excluirAviso(aviso: Aviso) {
    confirmarAcao(
      "Excluir aviso",
      `Tem certeza que deseja excluir "${aviso.titulo || "este aviso"}"?`,
      async () => {
        try {
          if (!(await exigirAdmin())) return;

          await deleteDoc(doc(db, "avisos", aviso.id));

          await registrarLog(
            "Aviso excluído",
            aviso.titulo || aviso.id
          );

          setAvisos((listaAtual) =>
            listaAtual.filter((item) => item.id !== aviso.id)
          );

          Alert.alert(
            "Aviso excluído",
            "O aviso foi excluído com sucesso."
          );
        } catch (error: any) {
          mostrarErro(
            "Erro ao excluir aviso",
            error,
            "Não foi possível excluir o aviso."
          );
        }
      }
    );
  }

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
  if (!(await exigirAdmin())) return;
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


  function excluirEscola(escola: string) {
    confirmarAcao(
      "Excluir escola",
      `Tem certeza que deseja remover "${escola}" da lista de escolas atendidas?`,
      async () => {
        try {
          if (!(await exigirAdmin())) return;

          const novoConfig = {
            ...config,
            escolas: config.escolas.filter((item) => item !== escola),
          };

          await salvarConfiguracoes(novoConfig);

          await registrarLog(
            "Escola removida",
            escola
          );
        } catch (error: any) {
          mostrarErro(
            "Erro ao excluir escola",
            error,
            "Não foi possível remover essa escola."
          );
        }
      }
    );
  }

  function excluirBairro(bairro: string) {
    confirmarAcao(
      "Excluir bairro",
      `Tem certeza que deseja remover "${bairro}" da lista de bairros atendidos?`,
      async () => {
        try {
          if (!(await exigirAdmin())) return;

          const novoConfig = {
            ...config,
            bairros: config.bairros.filter((item) => item !== bairro),
          };

          await salvarConfiguracoes(novoConfig);

          await registrarLog(
            "Bairro removido",
            bairro
          );
        } catch (error: any) {
          mostrarErro(
            "Erro ao excluir bairro",
            error,
            "Não foi possível remover esse bairro."
          );
        }
      }
    );
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


async function buscarAceitesTermos() {
  try {
    setCarregandoAceites(true);

    const resposta = await getDocs(collection(db, "aceitesTermos"));

    const lista: AceiteTermos[] = resposta.docs
      .map((item) => ({
        id: item.id,
        ...(item.data() as Omit<AceiteTermos, "id">),
      }))
      .sort((a, b) => {
        const ta = a.termosAceitosEm?.toMillis?.() || 0;
        const tb = b.termosAceitosEm?.toMillis?.() || 0;
        return tb - ta;
      });

    setAceitesTermos(lista);
  } catch (error: any) {
    mostrarErro(
      "Erro ao carregar aceites",
      error,
      "Não foi possível carregar o registro dos Termos de Uso."
    );
  } finally {
    setCarregandoAceites(false);
  }
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
        setFirebaseOnline(true);
      },
      (error) => {
        setFirebaseOnline(false);
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
          telefoneContato:
            dados.telefoneContato || "",
        });
        setFirebaseOnline(true);
      },
      (error) => {
        setFirebaseOnline(false);
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
    if (tela !== "perfil" && tela !== "menu") return;

    const usuario = auth.currentUser;
    if (!usuario) return;

    const consulta = query(
      collection(db, "alunos"),
      where("usuarioUid", "==", usuario.uid)
    );

    const parar = onSnapshot(
      consulta,
      (resposta) => {
        setMeusAlunos(
          resposta.docs.map((item) => ({
            id: item.id,
            ...(item.data() as Omit<Aluno, "id">),
          }))
        );
        setCarregandoPerfil(false);
      },
      (error) => console.log("Erro na sincronização do perfil:", error)
    );

    return () => parar();
  }, [tela]);

  useEffect(() => {
    if (tela !== "admin") return;

    let parar: (() => void) | undefined;

    usuarioEhAdmin().then((permitido) => {
      if (!permitido) return;

      parar = onSnapshot(
        collection(db, "alunos"),
        (resposta) => {
          setAlunos(
            resposta.docs.map((item) => ({
              id: item.id,
              ...(item.data() as Omit<Aluno, "id">),
            }))
          );
          setCarregandoAlunos(false);
        },
        (error) => console.log("Erro na sincronização dos alunos:", error)
      );
    });

    return () => {
      if (parar) parar();
    };
  }, [tela]);

  useEffect(() => {
    if (tela === "perfil" || tela === "menu") {
      buscarMeusAlunos();
      buscarAvisos();
    }

    if (tela === "avisosUsuario") {
      buscarAvisos();
    }

    if (tela === "admin") {
      usuarioEhAdmin().then((permitido) => {
        if (!permitido) {
          Alert.alert(
            "Acesso negado",
            "Sua conta não possui permissão de administrador."
          );
          setTela("menu");
          return;
        }

        buscarAlunos();
        buscarConfiguracoes();
        buscarAvisos();
        buscarVan();
        buscarLogs();
        buscarAceitesTermos();
        buscarPagamentosAno();
      });
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

  useEffect(() => {
    if (tela === "admin" && rotaAdmin === "dashboard") {
      buscarPagamentosAno();
    }
  }, [tela, rotaAdmin, anoAtual]);

  useEffect(() => {
    if (tela === "admin" && rotaAdmin === "dashboard") {
      graficoAnim.setValue(0);
      Animated.timing(graficoAnim, {
        toValue: 1,
        duration: 850,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    }
  }, [tela, rotaAdmin, anoAtual]);

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
    () => alunos,
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
        } ${aluno.bairro || ""} ${aluno.telefone || ""} ${
          aluno.usuarioEmail || ""
        }`.toLowerCase();

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

  const resultadosBuscaGlobal = useMemo(() => {
    const busca = buscaGlobalAdmin.trim().toLowerCase();

    if (!busca) return [];

    return alunos
      .filter((aluno) => {
        const conteudo = `${aluno.nomeAluno || ""} ${aluno.nomeResponsavel || ""} ${
          aluno.telefone || ""
        } ${aluno.usuarioEmail || ""} ${aluno.escola || ""} ${
          aluno.bairro || ""
        }`.toLowerCase();

        return conteudo.includes(busca);
      })
      .slice(0, 6);
  }, [alunos, buscaGlobalAdmin]);

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

  const capacidadeVan = Number(String(van.capacidade || "").replace(/\D/g, "")) || 0;
  const vagasDisponiveis = Math.max(capacidadeVan - alunosAtivos.length, 0);

  const totalRecebidoAno = pagamentosAno
    .filter((p) => p.status === "pago")
    .reduce((soma, p) => soma + Number(p.valor || 0), 0);

  const financeiroMensalAno = Array.from({ length: 12 }, (_, indice) => {
    const mes = indice + 1;
    const valor = pagamentosAno
      .filter((p) => p.mes === mes && p.status === "pago")
      .reduce((soma, p) => soma + Number(p.valor || 0), 0);

    return { mes, valor };
  });

  const maiorValorMensal = Math.max(
    ...financeiroMensalAno.map((item) => item.valor),
    1
  );

  const alunosAtrasados = alunosAtivos.filter((aluno) => {
    const p = pagamentos.find((item) => item.alunoId === aluno.id);
    return p?.status !== "pago" && estaAtrasado(p?.dataVencimento);
  });

  const alunosVencendo = alunosAtivos.filter((aluno) => {
    const p = pagamentos.find((item) => item.alunoId === aluno.id);
    return p?.status !== "pago" && estaVencendoEmSeteDias(p?.dataVencimento);
  });

  const notificacoesAdmin =
    solicitacoesPendentes.length +
    totalAtrasados +
    vencendo;

  const notificacoesResponsavel =
    (avisos.length > 0 ? 1 : 0) +
    (pagamentosPerfil.some(
      (p) => p.mes === mesAtual && p.ano === anoAtual && p.status === "pago"
    )
      ? 0
      : 1);

  // =====================================================
  // CENTRAL DE AJUDA
  // =====================================================

  if (tela === "ajuda") {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.page}>
        <HeaderPagina
          titulo="Central de ajuda"
          subtitulo="Respostas rápidas para responsáveis e usuários."
          voltar={() => setTela("inicio")}
        />

        <View style={styles.card}>
          <Text style={styles.secaoTituloSemMargem}>Como cadastrar uma criança?</Text>
          <Text style={styles.descricao}>
            Crie sua conta, entre no sistema e preencha o cadastro da criança.
            O cadastro ficará pendente até a aprovação do administrador.
          </Text>

          <Text style={styles.secaoTitulo}>Como sei se fui aprovado?</Text>
          <Text style={styles.descricao}>
            No perfil do responsável aparece a situação do cadastro de cada criança.
          </Text>

          <Text style={styles.secaoTitulo}>Como vejo os pagamentos?</Text>
          <Text style={styles.descricao}>
            Entre em “Ver meu perfil”. Lá aparecem a situação do mês e o histórico recente.
          </Text>

          <Text style={styles.secaoTitulo}>Esqueci minha senha</Text>
          <Text style={styles.descricao}>
            Na tela de entrada, digite seu e-mail e toque em “Esqueci minha senha”.
          </Text>

          <Text style={styles.secaoTitulo}>Preciso falar com a Angel Transports</Text>
          <Text style={styles.descricao}>
            Use o botão de ligação na página “Informações do transporte”.
          </Text>
        </View>
      </ScrollView>
    );
  }

  // =====================================================
  // NOVA VERSÃO DOS TERMOS
  // =====================================================

  if (tela === "termosPendentes") {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.page}>
        <HeaderPagina
          titulo="Atualização dos Termos"
          subtitulo={`Para continuar, leia e aceite a versão ${TERMOS_VERSAO} dos Termos de Uso e Privacidade.`}
          voltar={() => sair()}
        />

        <View style={styles.card}>
          <Text style={styles.secaoTituloSemMargem}>
            Termos de Uso e Privacidade
          </Text>

          <Text style={styles.descricao}>
            Atualizamos os termos do sistema. Seu acesso continua protegido e
            você precisa registrar o aceite desta nova versão para continuar.
          </Text>

          <TouchableOpacity
            style={styles.termosLinha}
            onPress={() => setAceiteNovaVersao((valor) => !valor)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: aceiteNovaVersao }}
            accessibilityLabel={`Aceitar versão ${TERMOS_VERSAO} dos Termos de Uso`}
          >
            <View
              style={[
                styles.checkboxTermos,
                aceiteNovaVersao && styles.checkboxTermosAtivo,
              ]}
            >
              {aceiteNovaVersao && (
                <Text style={styles.checkboxTermosCheck}>✓</Text>
              )}
            </View>

            <Text style={styles.termosTexto}>
              Li e aceito a versão {TERMOS_VERSAO} dos Termos de Uso e da
              Política de Privacidade.
            </Text>
          </TouchableOpacity>

          <BotaoAnimado
            texto="Ler os termos completos"
            secundario
            onPress={() => setTela("privacidade")}
          />

          <BotaoAnimado
            texto="Aceitar e continuar"
            onPress={async () => {
              if (!aceiteNovaVersao) {
                Alert.alert(
                  "Aceite necessário",
                  "Marque o quadradinho para aceitar os termos."
                );
                return;
              }

              const usuario = auth.currentUser;

              if (!usuario) {
                setTela("inicio");
                return;
              }

              try {
                await setDoc(
                  doc(db, "users", usuario.uid),
                  {
                    termosAceitos: true,
                    termosVersao: TERMOS_VERSAO,
                    termosAceitosEm: serverTimestamp(),
                  },
                  { merge: true }
                );

                await setDoc(
                  doc(db, "aceitesTermos", `${usuario.uid}_${TERMOS_VERSAO}`),
                  {
                    userId: usuario.uid,
                    name: usuario.displayName || "",
                    email: usuario.email || "",
                    termosVersao: TERMOS_VERSAO,
                    termosAceitosEm: serverTimestamp(),
                  }
                );

                setAceiteNovaVersao(false);
                mostrarSucessoNaTela("Nova versão dos termos aceita com sucesso.");
                setTela("menu");
              } catch (error: any) {
                mostrarErro(
                  "Erro ao registrar aceite",
                  error,
                  "Não foi possível registrar o aceite."
                );
              }
            }}
          />
        </View>
      </ScrollView>
    );
  }

  // =====================================================
  // PRIVACIDADE E TERMOS
  // =====================================================

  if (tela === "privacidade") {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.page}>
        <HeaderPagina
          titulo="Termos de Uso e Privacidade"
          subtitulo="Regras de uso do sistema e informações sobre tratamento de dados."
          voltar={() => setTela("inicio")}
        />

        <View style={styles.card}>
          <Text style={styles.secaoTituloSemMargem}>Termos de Uso</Text>
          <Text style={styles.descricao}>
            Ao criar uma conta, o responsável declara que as informações cadastradas
            são verdadeiras e que utilizará o sistema apenas para acompanhar e gerenciar
            os próprios cadastros vinculados ao transporte escolar.
          </Text>

          <Text style={styles.secaoTitulo}>Responsabilidade da conta</Text>
          <Text style={styles.descricao}>
            O usuário é responsável por manter sua senha em segurança e por não compartilhar
            o acesso da conta com terceiros.
          </Text>

          <Text style={styles.secaoTitulo}>Dados utilizados</Text>
          <Text style={styles.descricao}>
            O sistema utiliza dados necessários para organizar o transporte escolar,
            como nome da criança, responsável, telefone, escola, bairro, turno,
            situação do cadastro e informações de pagamento.
          </Text>

          <Text style={styles.secaoTitulo}>Finalidade</Text>
          <Text style={styles.descricao}>
            Os dados são usados para administração do transporte, comunicação com
            responsáveis, organização de mensalidades e atendimento.
          </Text>

          <Text style={styles.secaoTitulo}>Acesso</Text>
          <Text style={styles.descricao}>
            Responsáveis visualizam os próprios cadastros. Funções administrativas
            são restritas ao administrador pelas regras do Firebase.
          </Text>

          <Text style={styles.secaoTitulo}>Segurança</Text>
          <Text style={styles.descricao}>
            O acesso usa autenticação do Firebase. Não compartilhe sua senha com outras pessoas.
          </Text>

          <Text style={styles.secaoTitulo}>Contato</Text>
          <Text style={styles.descricao}>
            Para dúvidas sobre seus dados, entre em contato diretamente com a Angel Transports.
          </Text>
        </View>
      </ScrollView>
    );
  }

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

        <View
          style={[
            styles.statusSistema,
            firebaseOnline ? styles.statusSistemaOnline : styles.statusSistemaOffline,
          ]}
        >
          <View
            style={[
              styles.statusBolinha,
              { backgroundColor: firebaseOnline ? VERDE : VERMELHO },
            ]}
          />
          <Text
            style={[
              styles.statusSistemaTexto,
              { color: firebaseOnline ? VERDE : VERMELHO },
            ]}
          >
            {firebaseOnline ? "Sistema conectado" : "Sistema temporariamente indisponível"}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.secaoTituloSemMargem}>Nossa van</Text>
          <Info titulo="Modelo" valor={van.modelo || "Não informado"} />
          <Info titulo="Ano" valor={van.ano || "Não informado"} />
          <Info titulo="Capacidade" valor={van.capacidade || "Não informada"} />
          <Info
            titulo="Vagas disponíveis"
            valor={
              capacidadeVan > 0
                ? String(vagasDisponiveis)
                : "Capacidade não configurada"
            }
          />
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
            texto="Ligar para contratar o transporte"
            onPress={() =>
              ligarParaNumero(config.telefoneContato)
            }
          />
        </View>

        <BotaoAnimado
          texto="Central de ajuda"
          secundario
          onPress={() => setTela("ajuda")}
        />

        <BotaoAnimado
          texto="Privacidade e termos"
          secundario
          onPress={() => setTela("privacidade")}
        />

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
          <View style={[styles.hero, mobile && styles.heroMobile]}>
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
                mobile && styles.logoImagemContainerMobile,
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

            <Text style={[styles.title, mobile && styles.titleMobile]}>
              Angel Transports
            </Text>

            <Text style={[styles.subtitle, mobile && styles.subtitleMobile]}>
              Transporte escolar com segurança, organização e transparência
            </Text>
          </View>

          <Animated.View
            style={[
              styles.main,
              mobile && styles.mainMobile,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={[styles.card, mobile && styles.cardMobile]}>
              <Text style={styles.tag}>ACESSO AO SISTEMA</Text>

              <Text style={[styles.cardTitle, mobile && styles.cardTitleMobile]}>
                {modo === "login" ? "Bem-vindo" : "Criar conta"}
              </Text>

              <Text style={styles.descricao}>
                {modo === "login"
                  ? "Entre com sua conta para acessar o sistema."
                  : "Crie sua conta e cadastre sua criança."}
              </Text>

              <View
                style={[
                  styles.infoTransporteWrapper,
                  mobile && styles.infoTransporteWrapperMobile,
                ]}
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
      setAceitouTermos(false);
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

              {modo === "criar" && (
                <View style={styles.termosContainer}>
                  <TouchableOpacity
                    style={styles.termosLinha}
                    activeOpacity={0.8}
                    onPress={() => setAceitouTermos((valor) => !valor)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: aceitouTermos }}
                    accessibilityLabel="Aceitar Termos de Uso e Política de Privacidade"
                  >
                    <View
                      style={[
                        styles.checkboxTermos,
                        aceitouTermos && styles.checkboxTermosAtivo,
                      ]}
                    >
                      {aceitouTermos && (
                        <Text style={styles.checkboxTermosCheck}>✓</Text>
                      )}
                    </View>

                    <Text style={styles.termosTexto}>
                      Li e aceito os{" "}
                      <Text
                        style={styles.termosLink}
                        onPress={(evento: any) => {
                          evento?.stopPropagation?.();
                          setTela("privacidade");
                        }}
                      >
                        Termos de Uso e a Política de Privacidade
                      </Text>
                      .
                    </Text>
                  </TouchableOpacity>
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

              <View style={styles.rodapeCompleto}>
                <View style={styles.rodapeDivisor} />

                <Text style={styles.rodapeMarca}>Angel Transports</Text>
                <Text style={styles.rodapeDescricao}>
                  Transporte escolar com segurança, organização e transparência.
                </Text>

                <View style={styles.linksRodape}>
                  <TouchableOpacity onPress={() => setTela("ajuda")}>
                    <Text style={styles.linkRodapeText}>Central de ajuda</Text>
                  </TouchableOpacity>

                  <Text style={styles.rodapeSeparador}>•</Text>

                  <TouchableOpacity onPress={() => setTela("privacidade")}>
                    <Text style={styles.linkRodapeText}>Privacidade e termos</Text>
                  </TouchableOpacity>

                  <Text style={styles.rodapeSeparador}>•</Text>

                  <TouchableOpacity
                    onPress={() => ligarParaNumero(config.telefoneContato)}
                  >
                    <Text style={styles.linkRodapeText}>Contato</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.rodapeCopyright}>
                  © 2026 Angel Transports. Todos os direitos reservados.
                </Text>
              </View>
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
    const alunoPrincipal = meusAlunos[0];

    const pagamentoPrincipal = alunoPrincipal
      ? pagamentosPerfil.find(
          (p) =>
            p.alunoId === alunoPrincipal.id &&
            p.mes === mesAtual &&
            p.ano === anoAtual
        )
      : undefined;

    const ultimoAviso = avisos[0];

    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.centralResponsavelPage}
      >
        <Animated.View
          style={[
            styles.centralResponsavelHero,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.tag}>ANGEL TRANSPORTS</Text>
            <Text style={styles.centralResponsavelTitulo}>Área do responsável</Text>
            <Text style={styles.centralResponsavelSub}>
              Um resumo rápido do transporte da sua família.
            </Text>
          </View>

          <View style={styles.notificacaoTopo}>
            <Text style={styles.notificacaoSino}>!</Text>

            {notificacoesResponsavel > 0 && (
              <View style={styles.notificacaoBadge}>
                <Text style={styles.notificacaoBadgeTexto}>
                  {notificacoesResponsavel}
                </Text>
              </View>
            )}
          </View>
        </Animated.View>

        <OfflineBanner online={firebaseOnline} />
        <SessaoBadge tipo="Responsável" email={auth.currentUser?.email || ""} />

        {alunoPrincipal ? (
          <CardAnimado>
            <View style={styles.centralCarteirinha}>
              <View style={styles.centralAvatar}>
                <Text style={styles.centralAvatarTexto}>
                  {alunoPrincipal.nomeAluno?.charAt(0).toUpperCase() || "A"}
                </Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.centralAlunoNome}>
                  {alunoPrincipal.nomeAluno || "Aluno"}
                </Text>

                <Text style={styles.centralAlunoMeta}>
                  {alunoPrincipal.escola || "Escola não informada"} •{" "}
                  {alunoPrincipal.turno || "Turno não informado"}
                </Text>
              </View>

              <StatusChip
                texto={
                  alunoPrincipal.statusCadastro === "pendente"
                    ? "Pendente"
                    : alunoPrincipal.statusCadastro === "inativo"
                    ? "Inativo"
                    : "Ativo"
                }
                tipo={
                  alunoPrincipal.statusCadastro === "pendente"
                    ? "alerta"
                    : alunoPrincipal.statusCadastro === "inativo"
                    ? "erro"
                    : "sucesso"
                }
              />
            </View>
          </CardAnimado>
        ) : (
          <CardAnimado>
            <Vazio texto="Nenhuma criança cadastrada ainda." />
          </CardAnimado>
        )}

        <View style={styles.centralResumoGrid}>
          <CentralResumo
            titulo="Pagamento"
            valor={pagamentoPrincipal?.status === "pago" ? "Pago" : "Pendente"}
            tipo={pagamentoPrincipal?.status === "pago" ? "sucesso" : "alerta"}
          />

          <CentralResumo
            titulo="Avisos"
            valor={String(avisos.length)}
            tipo={avisos.length > 0 ? "alerta" : "sucesso"}
          />

          <CentralResumo
            titulo="Crianças"
            valor={String(meusAlunos.length)}
            tipo="neutro"
          />
        </View>

        {ultimoAviso && (
          <CardAnimado delay={80}>
            <View style={styles.centralAvisoTopo}>
              <Text style={styles.secaoTituloSemMargem}>Último aviso</Text>
              <StatusChip texto="Novo" tipo="alerta" />
            </View>

            <Text style={styles.centralAvisoTitulo}>{ultimoAviso.titulo}</Text>
            <Text style={styles.descricao}>{ultimoAviso.mensagem}</Text>

            <TouchableOpacity
              style={styles.centralLink}
              onPress={() => setTela("avisosUsuario")}
            >
              <Text style={styles.centralLinkTexto}>Ver todos os avisos →</Text>
            </TouchableOpacity>
          </CardAnimado>
        )}

        <View style={styles.centralAcoesGrid}>
          <CentralAcao
            titulo="Meu perfil"
            descricao="Dados, pagamentos e edição"
            onPress={() => setTela("perfil")}
          />

          <CentralAcao
            titulo="Cadastrar criança"
            descricao="Enviar um novo cadastro"
            onPress={() => setTela("cadastro")}
          />

          <CentralAcao
            titulo="Avisos"
            descricao="Comunicados do transporte"
            onPress={() => setTela("avisosUsuario")}
          />

          <CentralAcao
            titulo="Ajuda"
            descricao="Dúvidas e orientações"
            onPress={() => setTela("ajuda")}
          />
        </View>

        <TouchableOpacity style={styles.linkButton} onPress={sair}>
          <Text style={styles.linkText}>Sair da conta</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // =====================================================
  // PERFIL
  // =====================================================

  if (tela === "perfil") {
    return (
      <Animated.ScrollView
        style={styles.container}
        contentContainerStyle={styles.page}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: headerScroll } } }],
          { useNativeDriver: false }
        )}
      >
        <HeaderPagina
          titulo="Meu perfil"
          subtitulo="Veja seus alunos, situação de cadastro, pagamentos e segurança da conta."
          voltar={() => setTela("menu")}
          scrollY={headerScroll}
        />

        <SessaoBadge tipo="Responsável" email={auth.currentUser?.email || ""} />
        <FeedbackBanner mensagem={mensagemSistema} />

        {carregandoPerfil ? (
          <SkeletonCard />
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

                <TouchableOpacity
                  style={styles.botaoEditarResponsavel}
                  onPress={() => setAlunoResponsavelEditando({ ...aluno })}
                >
                  <Text style={styles.botaoEditarResponsavelTexto}>
                    Editar dados da criança
                  </Text>
                </TouchableOpacity>

                {!!aluno.observacoesResponsavel && (
                  <View style={styles.observacaoResponsavelBox}>
                    <Text style={styles.miniTitulo}>Suas observações</Text>
                    <Text style={styles.textoSecundario}>
                      {aluno.observacoesResponsavel}
                    </Text>
                  </View>
                )}

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

        {alunoResponsavelEditando && (
          <View style={styles.card}>
            <View style={styles.edicaoResponsavelCabecalho}>
              <View style={{ flex: 1 }}>
                <Text style={styles.secaoTituloSemMargem}>Editar criança</Text>
                <Text style={styles.textoSecundario}>
                  Você pode alterar os dados do seu próprio cadastro.
                </Text>
              </View>

              <TouchableOpacity onPress={() => setAlunoResponsavelEditando(null)}>
                <Text style={styles.fecharEdicaoResponsavel}>×</Text>
              </TouchableOpacity>
            </View>

            <Campo
              label="Nome da criança"
              value={alunoResponsavelEditando.nomeAluno || ""}
              onChange={(v) =>
                setAlunoResponsavelEditando({ ...alunoResponsavelEditando, nomeAluno: v })
              }
            />

            <Campo
              label="Nome do responsável"
              value={alunoResponsavelEditando.nomeResponsavel || ""}
              onChange={(v) =>
                setAlunoResponsavelEditando({ ...alunoResponsavelEditando, nomeResponsavel: v })
              }
            />

            <Campo
              label="Telefone"
              value={alunoResponsavelEditando.telefone || ""}
              onChange={(v) =>
                setAlunoResponsavelEditando({ ...alunoResponsavelEditando, telefone: v })
              }
            />

            <Campo
              label="Bairro"
              value={alunoResponsavelEditando.bairro || ""}
              onChange={(v) =>
                setAlunoResponsavelEditando({ ...alunoResponsavelEditando, bairro: v })
              }
            />

            <Campo
              label="Escola"
              value={alunoResponsavelEditando.escola || ""}
              onChange={(v) =>
                setAlunoResponsavelEditando({ ...alunoResponsavelEditando, escola: v })
              }
            />

            <Campo
              label="Turno"
              value={alunoResponsavelEditando.turno || ""}
              onChange={(v) =>
                setAlunoResponsavelEditando({ ...alunoResponsavelEditando, turno: v })
              }
            />

            <Text style={styles.label}>Tipo de transporte</Text>
            <View style={styles.opcoesTransporte}>
              {[
                ["ida", "Somente ida"],
                ["volta", "Somente volta"],
                ["ida_volta", "Ida e volta"],
              ].map(([valorOpcao, textoOpcao]) => (
                <TouchableOpacity
                  key={valorOpcao}
                  style={[
                    styles.opcaoTransporte,
                    alunoResponsavelEditando.tipoTransporte === valorOpcao &&
                      styles.opcaoTransporteAtiva,
                  ]}
                  onPress={() =>
                    setAlunoResponsavelEditando({
                      ...alunoResponsavelEditando,
                      tipoTransporte: valorOpcao as "ida" | "volta" | "ida_volta",
                    })
                  }
                >
                  <Text
                    style={[
                      styles.opcaoTransporteTexto,
                      alunoResponsavelEditando.tipoTransporte === valorOpcao &&
                        styles.opcaoTransporteTextoAtivo,
                    ]}
                  >
                    {textoOpcao}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Campo
              label="Contato de emergência"
              value={alunoResponsavelEditando.contatoEmergencia || ""}
              onChange={(v) =>
                setAlunoResponsavelEditando({
                  ...alunoResponsavelEditando,
                  contatoEmergencia: v,
                })
              }
            />

            <Text style={styles.label}>Observações sobre a criança</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={alunoResponsavelEditando.observacoesResponsavel || ""}
              onChangeText={(v) =>
                setAlunoResponsavelEditando({
                  ...alunoResponsavelEditando,
                  observacoesResponsavel: v,
                })
              }
              placeholder="Informações importantes para o transporte."
              placeholderTextColor="#9B8D92"
              multiline
              numberOfLines={4}
            />

            <BotaoAnimado
              texto="Salvar alterações"
              carregando={salvando}
              onPress={salvarEdicaoResponsavel}
            />

            <TouchableOpacity
              style={styles.botaoCancelarEdicao}
              onPress={() => setAlunoResponsavelEditando(null)}
            >
              <Text style={styles.botaoCancelarEdicaoTexto}>Cancelar</Text>
            </TouchableOpacity>
          </View>
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
      </Animated.ScrollView>
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

          <Text style={styles.label}>Tipo de transporte</Text>
          <View style={styles.opcoesTransporte}>
            {[
              ["ida", "Somente ida"],
              ["volta", "Somente volta"],
              ["ida_volta", "Ida e volta"],
            ].map(([valorOpcao, textoOpcao]) => (
              <TouchableOpacity
                key={valorOpcao}
                style={[
                  styles.opcaoTransporte,
                  tipoTransporte === valorOpcao && styles.opcaoTransporteAtiva,
                ]}
                onPress={() =>
                  setTipoTransporte(
                    valorOpcao as "ida" | "volta" | "ida_volta"
                  )
                }
              >
                <Text
                  style={[
                    styles.opcaoTransporteTexto,
                    tipoTransporte === valorOpcao &&
                      styles.opcaoTransporteTextoAtivo,
                  ]}
                >
                  {textoOpcao}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Campo
            label="Contato de emergência"
            value={contatoEmergencia}
            onChange={setContatoEmergencia}
            placeholder="Telefone com DDD"
          />

          <Text style={styles.label}>Observações sobre a criança</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={observacoesResponsavel}
            onChangeText={setObservacoesResponsavel}
            placeholder="Ex: informações importantes para o transporte, pessoas autorizadas ou outros cuidados."
            placeholderTextColor="#9B8D92"
            multiline
            numberOfLines={4}
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
          <SuccessCheck />

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
    <View style={styles.container}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.adminPage,
          mobile && styles.adminPageMobileComNav,
        ]}
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

      <OfflineBanner online={firebaseOnline} />

      <View style={styles.adminUtilidades}>
        <View style={{ flex: 1 }}>
          <SessaoBadge tipo="Administrador" email={auth.currentUser?.email || ""} />
        </View>

        <TouchableOpacity
          style={styles.notificacaoTopo}
          onPress={() => setRotaAdmin("dashboard")}
          accessibilityLabel={`${notificacoesAdmin} notificações administrativas`}
        >
          <Text style={styles.notificacaoSino}>!</Text>

          {notificacoesAdmin > 0 && (
            <View style={styles.notificacaoBadge}>
              <Text style={styles.notificacaoBadgeTexto}>
                {Math.min(notificacoesAdmin, 99)}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <FeedbackBanner mensagem={mensagemSistema} />

      <View style={styles.buscaGlobalBox}>
        <TextInput
          style={styles.buscaGlobalInput}
          value={buscaGlobalAdmin}
          onChangeText={setBuscaGlobalAdmin}
          placeholder="Busca rápida: aluno, responsável, telefone, e-mail..."
          placeholderTextColor="#9C8F92"
          accessibilityLabel="Busca global do administrador"
        />

        {!!buscaGlobalAdmin.trim() && (
          <View style={styles.buscaGlobalResultados}>
            {resultadosBuscaGlobal.length === 0 ? (
              <Text style={styles.textoSecundario}>
                Nenhum resultado encontrado.
              </Text>
            ) : (
              resultadosBuscaGlobal.map((aluno) => (
                <TouchableOpacity
                  key={aluno.id}
                  style={styles.buscaGlobalItem}
                  onPress={() => {
                    setBuscaGlobalAdmin("");
                    setRotaAdmin("alunos");
                    setBuscaAluno(aluno.nomeAluno || "");
                    verDetalhesAluno(aluno);
                  }}
                >
                  <View style={styles.buscaGlobalAvatar}>
                    <Text style={styles.buscaGlobalAvatarTexto}>
                      {aluno.nomeAluno?.charAt(0).toUpperCase() || "A"}
                    </Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.buscaGlobalNome}>
                      {aluno.nomeAluno || "Aluno"}
                    </Text>

                    <Text style={styles.buscaGlobalMeta}>
                      {aluno.nomeResponsavel || "Responsável"} •{" "}
                      {aluno.escola || "Sem escola"}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}
      </View>

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
            <ResumoCard
              titulo="Vagas disponíveis"
              valor={
                capacidadeVan > 0
                  ? String(vagasDisponiveis)
                  : "—"
              }
              verde={capacidadeVan > 0 && vagasDisponiveis > 0}
              vermelho={capacidadeVan > 0 && vagasDisponiveis === 0}
            />
            <ResumoCard
              titulo={`Recebido em ${anoAtual}`}
              valor={`R$ ${totalRecebidoAno.toFixed(2).replace(".", ",")}`}
              verde
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.secaoTituloSemMargem}>Atenção agora</Text>
            <Text style={styles.textoSecundario}>
              Atalhos para o que precisa de ação primeiro.
            </Text>

            <View style={styles.acoesInteligentesGrid}>
              <AcaoInteligente
                titulo="Solicitações"
                numero={solicitacoesPendentes.length}
                descricao="aguardando aprovação"
                tipo={solicitacoesPendentes.length > 0 ? "alerta" : "sucesso"}
                onPress={() => setRotaAdmin("solicitacoes")}
              />

              <AcaoInteligente
                titulo="Atrasados"
                numero={totalAtrasados}
                descricao="pagamentos vencidos"
                tipo={totalAtrasados > 0 ? "erro" : "sucesso"}
                onPress={() => setRotaAdmin("pagamentos")}
              />

              <AcaoInteligente
                titulo="Vencem em breve"
                numero={vencendo}
                descricao="nos próximos 7 dias"
                tipo={vencendo > 0 ? "alerta" : "sucesso"}
                onPress={() => setRotaAdmin("calendario")}
              />
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.termosAdminTopo}>
              <View style={{ flex: 1 }}>
                <Text style={styles.secaoTituloSemMargem}>
                  Aceites dos Termos de Uso
                </Text>
                <Text style={styles.textoSecundario}>
                  Registro permanente das contas que aceitaram os termos.
                </Text>
              </View>

              <View style={styles.termosAdminContador}>
                <Text style={styles.termosAdminContadorNumero}>
                  {aceitesTermos.length}
                </Text>
                <Text style={styles.termosAdminContadorTexto}>
                  aceites
                </Text>
              </View>
            </View>

            {carregandoAceites ? (
              <SkeletonLinha />
            ) : aceitesTermos.length === 0 ? (
              <Text style={styles.textoSecundario}>
                Nenhum aceite registrado ainda.
              </Text>
            ) : (
              aceitesTermos.map((aceite) => (
                <View key={aceite.id} style={styles.termosAdminLinha}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.termosAdminNome}>
                      {aceite.name || "Responsável"}
                    </Text>
                    <Text style={styles.termosAdminEmail}>
                      {aceite.email || "E-mail não informado"}
                    </Text>
                  </View>

                  <View style={styles.termosAdminDireita}>
                    <Text style={styles.termosAdminStatus}>ACEITO</Text>
                    <Text style={styles.termosAdminData}>
                      {formatarTimestamp(aceite.termosAceitosEm)}
                    </Text>
                    <Text style={styles.termosAdminVersao}>
                      Versão {aceite.termosVersao || "1.0"}
                    </Text>
                  </View>
                </View>
              ))
            )}
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

          <View style={[styles.card, mobile && styles.graficoCardMobile]}>
            <Text
              style={[
                styles.secaoTituloSemMargem,
                mobile && styles.graficoTituloMobile,
              ]}
            >
              Financeiro anual — {anoAtual}
            </Text>

            <View
              style={[
                styles.graficoAnual,
                mobile && styles.graficoAnualMobile,
              ]}
            >
              {financeiroMensalAno.map((item) => {
                const altura = Math.max(
                  5,
                  (item.valor / maiorValorMensal) * 120
                );

                return (
                  <Pressable
                    key={item.mes}
                    style={[
                      styles.graficoColunaArea,
                      mobile && styles.graficoColunaAreaMobile,
                    ]}
                    onPress={() =>
                      setGraficoTooltip({
                        mes: item.mes,
                        valor: item.valor,
                      })
                    }
                    onHoverIn={() =>
                      setGraficoTooltip({
                        mes: item.mes,
                        valor: item.valor,
                      })
                    }
                    onHoverOut={() => setGraficoTooltip(null)}
                    accessibilityRole="button"
                    accessibilityLabel={`${nomeMes(item.mes)}: R$ ${item.valor.toFixed(2)}`}
                  >
                    {graficoTooltip?.mes === item.mes && (
                      <View style={styles.graficoTooltip}>
                        <Text style={styles.graficoTooltipMes}>
                          {nomeMes(item.mes)}
                        </Text>
                        <Text style={styles.graficoTooltipValor}>
                          R$ {item.valor.toFixed(2).replace(".", ",")}
                        </Text>
                      </View>
                    )}

                    <Text
                      numberOfLines={2}
                      style={[
                        styles.graficoValor,
                        mobile && styles.graficoValorMobile,
                      ]}
                    >
                      {item.valor > 0
                        ? `R$ ${Math.round(item.valor)}`
                        : ""}
                    </Text>

                    <View
                      style={[
                        styles.graficoBase,
                        mobile && styles.graficoBaseMobile,
                      ]}
                    >
                      <Animated.View
                        style={[
                          styles.graficoBarra,
                          graficoTooltip?.mes === item.mes &&
                            styles.graficoBarraAtiva,
                          {
                            height: graficoAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0, altura],
                            }),
                          },
                        ]}
                      />
                    </View>

                    <Text
                      style={[
                        styles.graficoMes,
                        mobile && styles.graficoMesMobile,
                        graficoTooltip?.mes === item.mes &&
                          styles.graficoMesAtivo,
                      ]}
                    >
                      {nomeMes(item.mes).slice(0, 3)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.secaoTituloSemMargem}>Alertas financeiros</Text>

            {alunosAtrasados.length === 0 && alunosVencendo.length === 0 ? (
              <Text style={styles.descricao}>
                Nenhum alerta financeiro no momento.
              </Text>
            ) : (
              <>
                {alunosAtrasados.map((aluno) => (
                  <View key={`atrasado-${aluno.id}`} style={styles.alertaLinha}>
                    <Text style={styles.alertaTituloVermelho}>
                      {aluno.nomeAluno}
                    </Text>
                    <Text style={styles.alertaDescricao}>Pagamento atrasado</Text>
                  </View>
                ))}

                {alunosVencendo
                  .filter(
                    (aluno) =>
                      !alunosAtrasados.some(
                        (atrasado) => atrasado.id === aluno.id
                      )
                  )
                  .map((aluno) => (
                    <View key={`vencendo-${aluno.id}`} style={styles.alertaLinha}>
                      <Text style={styles.alertaTituloAmarelo}>
                        {aluno.nomeAluno}
                      </Text>
                      <Text style={styles.alertaDescricao}>
                        Vencimento nos próximos 7 dias
                      </Text>
                    </View>
                  ))}
              </>
            )}
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
              placeholder="Buscar aluno, responsável, telefone, e-mail, escola ou bairro"
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
              style={[
                styles.filtroButton,
                filtroStatus === "pendente" && styles.filtroButtonAtivo,
              ]}
              onPress={() => setFiltroStatus("pendente")}
            >
              <Text style={styles.filtroButtonText}>Pendentes</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filtroButton,
                filtroStatus === "recusado" && styles.filtroButtonAtivo,
              ]}
              onPress={() => setFiltroStatus("recusado")}
            >
              <Text style={styles.filtroButtonText}>Recusados</Text>
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

              <Text style={styles.label}>Tipo de transporte</Text>
              <View style={styles.opcoesTransporte}>
                {[
                  ["ida", "Somente ida"],
                  ["volta", "Somente volta"],
                  ["ida_volta", "Ida e volta"],
                ].map(([valorOpcao, textoOpcao]) => (
                  <TouchableOpacity
                    key={valorOpcao}
                    style={[
                      styles.opcaoTransporte,
                      (alunoEditando.tipoTransporte || "ida_volta") === valorOpcao &&
                        styles.opcaoTransporteAtiva,
                    ]}
                    onPress={() =>
                      setAlunoEditando({
                        ...alunoEditando,
                        tipoTransporte: valorOpcao as
                          | "ida"
                          | "volta"
                          | "ida_volta",
                      })
                    }
                  >
                    <Text
                      style={[
                        styles.opcaoTransporteTexto,
                        (alunoEditando.tipoTransporte || "ida_volta") === valorOpcao &&
                          styles.opcaoTransporteTextoAtivo,
                      ]}
                    >
                      {textoOpcao}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Campo
                label="Horário de embarque"
                value={alunoEditando.horarioEmbarque || ""}
                onChange={(v) =>
                  setAlunoEditando({ ...alunoEditando, horarioEmbarque: v })
                }
                placeholder="Ex: 12:40"
              />

              <Campo
                label="Contato de emergência"
                value={alunoEditando.contatoEmergencia || ""}
                onChange={(v) =>
                  setAlunoEditando({ ...alunoEditando, contatoEmergencia: v })
                }
                placeholder="Telefone"
              />

              <Text style={styles.label}>Contrato</Text>
              <View style={styles.opcoesTransporte}>
                {[
                  ["pendente", "Pendente"],
                  ["assinado", "Assinado"],
                ].map(([valorOpcao, textoOpcao]) => (
                  <TouchableOpacity
                    key={valorOpcao}
                    style={[
                      styles.opcaoTransporte,
                      (alunoEditando.statusContrato || "pendente") === valorOpcao &&
                        styles.opcaoTransporteAtiva,
                    ]}
                    onPress={() =>
                      setAlunoEditando({
                        ...alunoEditando,
                        statusContrato: valorOpcao as "pendente" | "assinado",
                      })
                    }
                  >
                    <Text
                      style={[
                        styles.opcaoTransporteTexto,
                        (alunoEditando.statusContrato || "pendente") === valorOpcao &&
                          styles.opcaoTransporteTextoAtivo,
                      ]}
                    >
                      {textoOpcao}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Campo
                label="Data de início do transporte"
                value={alunoEditando.dataInicioTransporte || ""}
                onChange={(v) =>
                  setAlunoEditando({
                    ...alunoEditando,
                    dataInicioTransporte: v,
                  })
                }
                placeholder="Ex: 01/02/2026"
              />

              <Campo
                label="Data de término do transporte"
                value={alunoEditando.dataFimTransporte || ""}
                onChange={(v) =>
                  setAlunoEditando({
                    ...alunoEditando,
                    dataFimTransporte: v,
                  })
                }
                placeholder="Ex: 15/12/2026"
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
                <Info
                  titulo="Transporte"
                  valor={formatarTipoTransporte(alunoSelecionado.tipoTransporte)}
                />
                <Info
                  titulo="Horário"
                  valor={alunoSelecionado.horarioEmbarque || "Não informado"}
                />
                <Info
                  titulo="Contato de emergência"
                  valor={alunoSelecionado.contatoEmergencia || "Não informado"}
                />
                <Info
                  titulo="Contrato"
                  valor={
                    alunoSelecionado.statusContrato === "assinado"
                      ? "Assinado"
                      : "Pendente"
                  }
                />
                <Info
                  titulo="Início"
                  valor={alunoSelecionado.dataInicioTransporte || "Não informado"}
                />
                <Info
                  titulo="Término"
                  valor={alunoSelecionado.dataFimTransporte || "Não informado"}
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

              <Text style={styles.secaoTitulo}>Histórico de alterações</Text>

              {historicoAlunoSelecionado.length === 0 ? (
                <Text style={styles.textoSecundario}>
                  Nenhuma alteração registrada ainda.
                </Text>
              ) : (
                historicoAlunoSelecionado.slice(0, 12).map((item) => (
                  <View key={item.id} style={styles.historicoAlteracaoLinha}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.historicoAlteracaoAcao}>
                        {item.acao}
                      </Text>
                      <Text style={styles.textoSecundario}>
                        {item.autorTipo === "admin" ? "Administrador" : "Responsável"}
                        {item.autorEmail ? ` • ${item.autorEmail}` : ""}
                      </Text>
                    </View>
                    <Text style={styles.historicoAlteracaoData}>
                      {formatarTimestamp(item.criadoEm)}
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
            <SkeletonCard />
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
            <SkeletonCard />
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

          <View style={styles.centralResumoGrid}>
            <CentralResumo titulo="Pagos" valor={String(totalPago)} tipo="sucesso" />
            <CentralResumo
              titulo="Atrasados"
              valor={String(totalAtrasados)}
              tipo={totalAtrasados > 0 ? "erro" : "sucesso"}
            />
            <CentralResumo
              titulo="Próximos 7 dias"
              valor={String(vencendo)}
              tipo={vencendo > 0 ? "alerta" : "sucesso"}
            />
          </View>

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
            avisos.map((aviso) => (
              <View key={aviso.id} style={styles.card}>
                <AvisoCard aviso={aviso} />

                <TouchableOpacity
                  style={styles.botaoExcluirAviso}
                  onPress={() => excluirAviso(aviso)}
                >
                  <Text style={styles.botaoExcluirAvisoTexto}>Excluir aviso</Text>
                </TouchableOpacity>
              </View>
            ))
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

            <TouchableOpacity
              style={styles.exportarButton}
              onPress={() =>
                baixarCSV("auditoria-angel-transports.csv", [
                  ["Ação", "Detalhes", "Administrador", "Data"],
                  ...logsSistema.map((log) => [
                    log.acao || "",
                    log.detalhes || "",
                    log.adminEmail || "",
                    formatarTimestamp(log.criadoEm),
                  ]),
                ])
              }
            >
              <Text style={styles.exportarButtonText}>Auditoria CSV</Text>
            </TouchableOpacity>
          </View>

          {carregandoLogs ? (
            <SkeletonCard />
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
                <View key={`${item}-${index}`} style={styles.chipGerenciavel}>
                  <Text style={styles.chipGerenciavelText}>{item}</Text>

                  <TouchableOpacity
                    style={styles.chipExcluirButton}
                    onPress={() => excluirEscola(item)}
                    accessibilityLabel={`Excluir escola ${item}`}
                  >
                    <Text style={styles.chipExcluirText}>×</Text>
                  </TouchableOpacity>
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
                <View key={`${item}-${index}`} style={styles.chipGerenciavel}>
                  <Text style={styles.chipGerenciavelText}>{item}</Text>

                  <TouchableOpacity
                    style={styles.chipExcluirButton}
                    onPress={() => excluirBairro(item)}
                    accessibilityLabel={`Excluir bairro ${item}`}
                  >
                    <Text style={styles.chipExcluirText}>×</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        </>
      )}
      </ScrollView>

      {mobile && (
        <MobileBottomNav
          rota={rotaAdmin}
          mudarRota={setRotaAdmin}
          pendentes={solicitacoesPendentes.length}
        />
      )}

      <ConfirmacaoModal
        visivel={!!confirmacao}
        titulo={confirmacao?.titulo || ""}
        mensagem={confirmacao?.mensagem || ""}
        cancelar={() => setConfirmacao(null)}
        confirmar={() => {
          const acao = confirmacao?.confirmar;
          setConfirmacao(null);
          acao?.();
        }}
      />
    </View>
  );
}

// =====================================================
// COMPONENTES
// =====================================================

function OfflineBanner({ online }: { online: boolean }) {
  if (online) return null;

  return (
    <View style={styles.offlineBanner} accessibilityRole="alert">
      <View style={styles.offlinePonto} />

      <View style={{ flex: 1 }}>
        <Text style={styles.offlineTitulo}>Sem conexão com o sistema</Text>
        <Text style={styles.offlineTexto}>
          Evite salvar alterações até a conexão voltar.
        </Text>
      </View>
    </View>
  );
}

function CentralResumo({
  titulo,
  valor,
  tipo,
}: {
  titulo: string;
  valor: string;
  tipo: "sucesso" | "alerta" | "erro" | "neutro";
}) {
  return (
    <View style={styles.centralResumoCard}>
      <Text style={styles.centralResumoTitulo}>{titulo}</Text>

      <Text
        style={[
          styles.centralResumoValor,
          tipo === "sucesso" && { color: VERDE },
          tipo === "alerta" && { color: AMARELO },
          tipo === "erro" && { color: VERMELHO },
        ]}
      >
        {valor}
      </Text>
    </View>
  );
}

function CentralAcao({
  titulo,
  descricao,
  onPress,
}: {
  titulo: string;
  descricao: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={styles.centralAcaoCard}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={titulo}
    >
      <View style={styles.centralAcaoSeta}>
        <Text style={styles.centralAcaoSetaTexto}>→</Text>
      </View>

      <Text style={styles.centralAcaoTitulo}>{titulo}</Text>
      <Text style={styles.centralAcaoDescricao}>{descricao}</Text>
    </Pressable>
  );
}

function AcaoInteligente({
  titulo,
  numero,
  descricao,
  tipo,
  onPress,
}: {
  titulo: string;
  numero: number;
  descricao: string;
  tipo: "sucesso" | "alerta" | "erro";
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.acaoInteligenteCard}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${titulo}: ${numero} ${descricao}`}
    >
      <StatusChip
        texto={tipo === "sucesso" ? "OK" : "Atenção"}
        tipo={tipo}
      />

      <Text style={styles.acaoInteligenteNumero}>{numero}</Text>
      <Text style={styles.acaoInteligenteTitulo}>{titulo}</Text>
      <Text style={styles.acaoInteligenteDescricao}>{descricao}</Text>
    </TouchableOpacity>
  );
}

function ConfirmacaoModal({
  visivel,
  titulo,
  mensagem,
  cancelar,
  confirmar,
}: {
  visivel: boolean;
  titulo: string;
  mensagem: string;
  cancelar: () => void;
  confirmar: () => void;
}) {
  const escala = useRef(new Animated.Value(0.9)).current;
  const opacidade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visivel) {
      escala.setValue(0.9);
      opacidade.setValue(0);
      Animated.parallel([
        Animated.spring(escala, {
          toValue: 1,
          speed: 20,
          bounciness: 5,
          useNativeDriver: true,
        }),
        Animated.timing(opacidade, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visivel]);

  return (
    <Modal
      visible={visivel}
      transparent
      animationType="fade"
      onRequestClose={cancelar}
    >
      <View style={styles.modalOverlay}>
        <Animated.View
          style={[
            styles.modalCard,
            {
              opacity: opacidade,
              transform: [{ scale: escala }],
            },
          ]}
        >
          <View style={styles.modalIcone}>
            <Text style={styles.modalIconeText}>!</Text>
          </View>

          <Text style={styles.modalTitulo}>{titulo}</Text>
          <Text style={styles.modalMensagem}>{mensagem}</Text>

          <View style={styles.modalAcoes}>
            <TouchableOpacity
              style={styles.modalCancelar}
              onPress={cancelar}
              accessibilityRole="button"
              accessibilityLabel="Cancelar"
            >
              <Text style={styles.modalCancelarTexto}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalConfirmar}
              onPress={confirmar}
              accessibilityRole="button"
              accessibilityLabel="Confirmar ação"
            >
              <Text style={styles.modalConfirmarTexto}>Confirmar</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

function MobileBottomNav({
  rota,
  mudarRota,
  pendentes,
}: {
  rota: RotaAdmin;
  mudarRota: (rota: RotaAdmin) => void;
  pendentes: number;
}) {
  const itens: { rota: RotaAdmin; icone: string; texto: string }[] = [
    { rota: "dashboard", icone: "⌂", texto: "Início" },
    { rota: "alunos", icone: "♙", texto: "Alunos" },
    { rota: "pagamentos", icone: "$", texto: "Pagamentos" },
    { rota: "avisos", icone: "!", texto: "Avisos" },
    { rota: "configuracoes", icone: "⚙", texto: "Config." },
  ];

  return (
    <View style={styles.mobileBottomNav}>
      {itens.map((item) => (
        <MobileBottomItem
          key={item.rota}
          item={item}
          ativo={rota === item.rota}
          badge={
            item.rota === "avisos" && pendentes > 0
              ? Math.min(pendentes, 9)
              : 0
          }
          onPress={() => mudarRota(item.rota)}
        />
      ))}
    </View>
  );
}

function MobileBottomItem({
  item,
  ativo,
  badge,
  onPress,
}: {
  item: { rota: RotaAdmin; icone: string; texto: string };
  ativo: boolean;
  badge: number;
  onPress: () => void;
}) {
  const progresso = useRef(new Animated.Value(ativo ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(progresso, {
      toValue: ativo ? 1 : 0,
      speed: 20,
      bounciness: 5,
      useNativeDriver: true,
    }).start();
  }, [ativo]);

  const escala = progresso.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.12],
  });

  const subir = progresso.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -4],
  });

  return (
    <TouchableOpacity
      style={styles.mobileBottomItem}
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: ativo }}
      accessibilityLabel={item.texto}
    >
      <Animated.View
        style={[
          styles.mobileBottomIcone,
          ativo && styles.mobileBottomIconeAtivo,
          { transform: [{ scale: escala }, { translateY: subir }] },
        ]}
      >
        <Text
          style={[
            styles.mobileBottomIconeTexto,
            ativo && styles.mobileBottomIconeTextoAtivo,
          ]}
        >
          {item.icone}
        </Text>

        {badge > 0 && (
          <View style={styles.mobileBottomBadge}>
            <Text style={styles.mobileBottomBadgeTexto}>{badge}</Text>
          </View>
        )}
      </Animated.View>

      <Text
        style={[
          styles.mobileBottomTexto,
          ativo && styles.mobileBottomTextoAtivo,
        ]}
      >
        {item.texto}
      </Text>

      <Animated.View
        style={[
          styles.mobileBottomIndicador,
          {
            opacity: progresso,
            transform: [{ scaleX: progresso }],
          },
        ]}
      />
    </TouchableOpacity>
  );
}

function SkeletonCard() {
  const pulso = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulso, {
          toValue: 0.75,
          duration: 650,
          useNativeDriver: true,
        }),
        Animated.timing(pulso, {
          toValue: 0.35,
          duration: 650,
          useNativeDriver: true,
        }),
      ])
    );

    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <Animated.View style={[styles.skeletonCard, { opacity: pulso }]}>
      <View style={styles.skeletonTitulo} />
      <View style={styles.skeletonLinhaGrande} />
      <View style={styles.skeletonLinhaMedia} />
    </Animated.View>
  );
}

function SkeletonLinha() {
  const pulso = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulso, {
          toValue: 0.75,
          duration: 650,
          useNativeDriver: true,
        }),
        Animated.timing(pulso, {
          toValue: 0.35,
          duration: 650,
          useNativeDriver: true,
        }),
      ])
    );

    loop.start();
    return () => loop.stop();
  }, []);

  return <Animated.View style={[styles.skeletonLinha, { opacity: pulso }]} />;
}

function SuccessCheck() {
  const escala = useRef(new Animated.Value(0)).current;
  const giro = useRef(new Animated.Value(0)).current;
  const halo = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(escala, {
          toValue: 1,
          speed: 15,
          bounciness: 12,
          useNativeDriver: true,
        }),
        Animated.timing(giro, {
          toValue: 1,
          duration: 520,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(halo, {
        toValue: 1,
        duration: 650,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const rotacao = giro.interpolate({
    inputRange: [0, 1],
    outputRange: ["-30deg", "0deg"],
  });

  const haloEscala = halo.interpolate({
    inputRange: [0, 1],
    outputRange: [0.7, 1.8],
  });

  const haloOpacidade = halo.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [0, 0.32, 0],
  });

  return (
    <View style={styles.successCheckWrapper}>
      <Animated.View
        style={[
          styles.successHalo,
          {
            opacity: haloOpacidade,
            transform: [{ scale: haloEscala }],
          },
        ]}
      />

      <Animated.View
        style={[
          styles.checkCircle,
          {
            transform: [{ scale: escala }, { rotate: rotacao }],
          },
        ]}
      >
        <Text style={styles.check}>✓</Text>
      </Animated.View>
    </View>
  );
}

function FeedbackBanner({ mensagem }: { mensagem: string }) {
  const entrada = useRef(new Animated.Value(-18)).current;
  const opacidade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!mensagem) return;

    entrada.setValue(-18);
    opacidade.setValue(0);

    Animated.parallel([
      Animated.spring(entrada, {
        toValue: 0,
        speed: 20,
        bounciness: 5,
        useNativeDriver: true,
      }),
      Animated.timing(opacidade, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
  }, [mensagem]);

  if (!mensagem) return null;

  return (
    <Animated.View
      style={[
        styles.feedbackBanner,
        {
          opacity: opacidade,
          transform: [{ translateY: entrada }],
        },
      ]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <View style={styles.toastCheck}>
        <Text style={styles.toastCheckText}>✓</Text>
      </View>
      <Text style={styles.feedbackBannerTexto}>{mensagem}</Text>
    </Animated.View>
  );
}

function SessaoBadge({
  tipo,
  email,
}: {
  tipo: "Administrador" | "Responsável";
  email: string;
}) {
  return (
    <View style={styles.sessaoBadge}>
      <View
        style={[
          styles.sessaoBolinha,
          { backgroundColor: tipo === "Administrador" ? VINHO : VERDE },
        ]}
      />
      <View style={{ flex: 1 }}>
        <Text style={styles.sessaoTipo}>Logado como {tipo}</Text>
        <Text style={styles.sessaoEmail}>{email || "Conta conectada"}</Text>
      </View>
    </View>
  );
}


function StatusChip({
  texto,
  tipo = "neutro",
}: {
  texto: string;
  tipo?: "sucesso" | "alerta" | "erro" | "neutro";
}) {
  return (
    <View
      style={[
        styles.statusChip,
        tipo === "sucesso" && styles.statusChipSucesso,
        tipo === "alerta" && styles.statusChipAlerta,
        tipo === "erro" && styles.statusChipErro,
      ]}
    >
      <Text
        style={[
          styles.statusChipTexto,
          tipo === "sucesso" && styles.statusChipTextoSucesso,
          tipo === "alerta" && styles.statusChipTextoAlerta,
          tipo === "erro" && styles.statusChipTextoErro,
        ]}
      >
        {texto.toUpperCase()}
      </Text>
    </View>
  );
}

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
        accessibilityRole="button"
        accessibilityLabel={texto}
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
  const movimento = useRef(new Animated.Value(28)).current;
  const escala = useRef(new Animated.Value(0.985)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 380,
        delay,
        useNativeDriver: true,
      }),
      Animated.spring(movimento, {
        toValue: 0,
        delay,
        speed: 17,
        bounciness: 5,
        useNativeDriver: true,
      }),
      Animated.spring(escala, {
        toValue: 1,
        delay,
        speed: 17,
        bounciness: 4,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={{
        opacity,
        transform: [
          { translateY: movimento },
          { scale: escala },
        ],
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

      {pago && (
        <BotaoAnimado
          texto="Gerar comprovante"
          secundario
          onPress={() =>
            gerarComprovantePagamento(aluno, pagamento)
          }
        />
      )}

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
  placeholder?: string;
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
        accessibilityLabel={label}
      />
    </>
  );
}

function HeaderPagina({
  titulo,
  subtitulo,
  voltar,
  scrollY,
}: {
  titulo: string;
  subtitulo: string;
  voltar: () => void;
  scrollY?: Animated.Value;
}) {
  const altura = scrollY
    ? scrollY.interpolate({
        inputRange: [0, 90],
        outputRange: [122, 82],
        extrapolate: "clamp",
      })
    : 122;

  const tituloTamanho = scrollY
    ? scrollY.interpolate({
        inputRange: [0, 90],
        outputRange: [30, 22],
        extrapolate: "clamp",
      })
    : 30;

  const subtituloOpacidade = scrollY
    ? scrollY.interpolate({
        inputRange: [0, 65],
        outputRange: [1, 0],
        extrapolate: "clamp",
      })
    : 1;

  return (
    <Animated.View style={[styles.pageHeader, { minHeight: altura }]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.tag}>ANGEL TRANSPORTS</Text>

        <Animated.Text
          style={[
            styles.pageTitle,
            { fontSize: tituloTamanho },
          ]}
        >
          {titulo}
        </Animated.Text>

        <Animated.Text
          style={[
            styles.pageSubtitulo,
            { opacity: subtituloOpacidade },
          ]}
        >
          {subtitulo}
        </Animated.Text>
      </View>

      <TouchableOpacity
        style={styles.sairButton}
        onPress={voltar}
        accessibilityRole="button"
        accessibilityLabel="Voltar"
      >
        <Text style={styles.sairButtonText}>Voltar</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

function AlunoCard({ aluno }: { aluno: Aluno }) {
  const [expandido, setExpandido] = useState(false);
  const animacao = useRef(new Animated.Value(0)).current;

  function alternar() {
    const proximo = !expandido;
    setExpandido(proximo);

    Animated.spring(animacao, {
      toValue: proximo ? 1 : 0,
      speed: 18,
      bounciness: 4,
      useNativeDriver: false,
    }).start();
  }

  const alturaDetalhes = animacao.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 265],
  });

  const opacidadeDetalhes = animacao.interpolate({
    inputRange: [0, 0.35, 1],
    outputRange: [0, 0, 1],
  });

  const rotacao = animacao.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  return (
    <View style={styles.alunoCard}>
      <TouchableOpacity
        style={styles.alunoTopo}
        onPress={alternar}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityState={{ expanded: expandido }}
        accessibilityLabel={`${expandido ? "Fechar" : "Abrir"} detalhes de ${
          aluno.nomeAluno || "aluno"
        }`}
      >
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

        <Animated.View style={{ transform: [{ rotate: rotacao }] }}>
          <Text style={styles.alunoExpandirIcone}>⌄</Text>
        </Animated.View>
      </TouchableOpacity>

      <Animated.View
        style={[
          styles.alunoDetalhesAnimados,
          {
            maxHeight: alturaDetalhes,
            opacity: opacidadeDetalhes,
          },
        ]}
      >
        <View style={styles.infoGrade}>
          <Info titulo="Responsável" valor={aluno.nomeResponsavel} />
          <Info titulo="Telefone" valor={aluno.telefone} />
          <Info titulo="Bairro" valor={aluno.bairro} />
          <Info titulo="Turno" valor={aluno.turno} />
          <Info titulo="Tipo" valor={formatarTipoTransporte(aluno.tipoTransporte)} />
          <Info
            titulo="Emergência"
            valor={aluno.contatoEmergencia || "Não informado"}
          />
        </View>
      </Animated.View>
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
  const entrada = useRef(new Animated.Value(0)).current;
  const numero = Number(String(valor).replace(/[^\d.-]/g, ""));
  const somenteNumero = /^-?\d+(\.\d+)?$/.test(valor.trim());
  const [numeroVisivel, setNumeroVisivel] = useState(
    somenteNumero ? "0" : valor
  );

  useEffect(() => {
    entrada.setValue(0);

    const listener = entrada.addListener(({ value: atual }) => {
      if (somenteNumero && Number.isFinite(numero)) {
        setNumeroVisivel(String(Math.round(numero * atual)));
      }
    });

    Animated.timing(entrada, {
      toValue: 1,
      duration: 700,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    return () => entrada.removeListener(listener);
  }, [valor]);

  return (
    <CardHover>
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
          {somenteNumero ? numeroVisivel : valor}
        </Text>
      </View>
    </CardHover>
  );
}

function CardHover({ children }: { children: ReactNode }) {
  const escala = useRef(new Animated.Value(1)).current;
  const subir = useRef(new Animated.Value(0)).current;

  const animar = (ativo: boolean) => {
    Animated.parallel([
      Animated.spring(escala, {
        toValue: ativo ? 1.018 : 1,
        speed: 22,
        bounciness: 4,
        useNativeDriver: true,
      }),
      Animated.spring(subir, {
        toValue: ativo ? -4 : 0,
        speed: 22,
        bounciness: 4,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <Animated.View
      style={{
        flexGrow: 1,
        flexBasis: 150,
        transform: [{ scale: escala }, { translateY: subir }],
      }}
    >
      <Pressable onHoverIn={() => animar(true)} onHoverOut={() => animar(false)}>
        {children}
      </Pressable>
    </Animated.View>
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

function formatarTipoTransporte(
  tipo?: "ida" | "volta" | "ida_volta"
) {
  if (tipo === "ida") return "Somente ida";
  if (tipo === "volta") return "Somente volta";
  return "Ida e volta";
}

function gerarComprovantePagamento(
  aluno: Aluno,
  pagamento?: Pagamento
) {
  if (!pagamento || pagamento.status !== "pago") {
    Alert.alert(
      "Pagamento não confirmado",
      "O comprovante só pode ser gerado depois que o pagamento estiver marcado como pago."
    );
    return;
  }

  const html = `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Comprovante - Angel Transports</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 40px;
            color: #2b2024;
          }
          .comprovante {
            max-width: 700px;
            margin: 0 auto;
            border: 1px solid #e3d5da;
            border-radius: 18px;
            padding: 32px;
          }
          h1 { color: #69172D; margin-bottom: 4px; }
          .linha { margin: 12px 0; }
          .rotulo { color: #7d7075; font-size: 12px; }
          .valor { font-size: 17px; font-weight: bold; }
          .ok {
            color: #248A46;
            font-weight: bold;
            margin-top: 24px;
          }
        </style>
      </head>
      <body>
        <div class="comprovante">
          <h1>Angel Transports</h1>
          <p>Comprovante de pagamento</p>

          <div class="linha">
            <div class="rotulo">Aluno</div>
            <div class="valor">${aluno.nomeAluno || ""}</div>
          </div>

          <div class="linha">
            <div class="rotulo">Referência</div>
            <div class="valor">${nomeMes(pagamento.mes)} / ${pagamento.ano}</div>
          </div>

          <div class="linha">
            <div class="rotulo">Valor</div>
            <div class="valor">R$ ${Number(pagamento.valor || 0)
              .toFixed(2)
              .replace(".", ",")}</div>
          </div>

          <div class="linha">
            <div class="rotulo">Data registrada</div>
            <div class="valor">${formatarTimestamp(pagamento.dataPagamento)}</div>
          </div>

          <div class="ok">PAGAMENTO CONFIRMADO</div>
        </div>
      </body>
    </html>
  `;

  if (Platform.OS === "web") {
    const g: any = globalThis as any;
    const janela = g.window?.open("", "_blank");

    if (!janela) {
      Alert.alert(
        "Pop-up bloqueado",
        "Permita pop-ups para gerar o comprovante."
      );
      return;
    }

    janela.document.write(html);
    janela.document.close();
    janela.focus();

    setTimeout(() => {
      janela.print();
    }, 350);

    return;
  }

  Alert.alert(
    "Comprovante",
    "Na versão web você pode gerar e salvar o comprovante como PDF pelo navegador."
  );
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
  graficoTooltip: {
    position: "absolute",
    top: -46,
    left: "50%",
    transform: [{ translateX: -38 }],
    minWidth: 76,
    backgroundColor: VINHO_ESCURO,
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 8,
    alignItems: "center",
    zIndex: 20,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },

  graficoTooltipMes: {
    color: "#F4DDE5",
    fontSize: 8,
    fontWeight: "800",
  },

  graficoTooltipValor: {
    color: BRANCO,
    fontSize: 9,
    fontWeight: "900",
    marginTop: 2,
  },

  graficoBarraAtiva: {
    opacity: 0.78,
  },

  graficoMesAtivo: {
    color: VINHO,
    fontWeight: "900",
  },

  alunoDetalhesAnimados: {
    overflow: "hidden",
  },

  alunoExpandirIcone: {
    color: VINHO,
    fontSize: 22,
    fontWeight: "900",
    paddingHorizontal: 4,
  },

  mobileBottomIndicador: {
    width: 22,
    height: 3,
    borderRadius: 999,
    backgroundColor: VINHO,
    marginTop: 4,
  },

  successCheckWrapper: {
    width: 94,
    height: 94,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 12,
  },

  successHalo: {
    position: "absolute",
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: VERDE,
  },


  centralResponsavelPage: {
    width: "100%",
    maxWidth: 940,
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 60,
  },

  centralResponsavelHero: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: VINHO,
    borderRadius: 26,
    padding: 22,
    marginBottom: 14,
    shadowColor: "#350812",
    shadowOpacity: 0.18,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 9 },
    elevation: 5,
  },

  centralResponsavelTitulo: {
    color: BRANCO,
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -0.5,
  },

  centralResponsavelSub: {
    color: "#F5E8EC",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },

  notificacaoTopo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F8EDF1",
    borderWidth: 1,
    borderColor: "#E5CDD5",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  notificacaoSino: {
    color: VINHO,
    fontSize: 20,
    fontWeight: "900",
  },

  notificacaoBadge: {
    position: "absolute",
    right: -5,
    top: -5,
    minWidth: 19,
    height: 19,
    borderRadius: 10,
    paddingHorizontal: 4,
    backgroundColor: VERMELHO,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: BRANCO,
  },

  notificacaoBadgeTexto: {
    color: BRANCO,
    fontSize: 8,
    fontWeight: "900",
  },

  centralCarteirinha: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  centralAvatar: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: "#F1E2E7",
    alignItems: "center",
    justifyContent: "center",
  },

  centralAvatarTexto: {
    color: VINHO,
    fontSize: 22,
    fontWeight: "900",
  },

  centralAlunoNome: {
    color: VINHO_ESCURO,
    fontSize: 18,
    fontWeight: "900",
  },

  centralAlunoMeta: {
    color: "#74686C",
    fontSize: 11,
    marginTop: 4,
  },

  centralResumoGrid: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 14,
  },

  centralResumoCard: {
    flexGrow: 1,
    flexBasis: 120,
    minHeight: 88,
    backgroundColor: BRANCO,
    borderRadius: 18,
    padding: 15,
    borderWidth: 1,
    borderColor: "#EAE0E3",
    justifyContent: "space-between",
  },

  centralResumoTitulo: {
    color: "#786B70",
    fontSize: 10,
    fontWeight: "800",
  },

  centralResumoValor: {
    color: VINHO,
    fontSize: 21,
    fontWeight: "900",
    marginTop: 10,
  },

  centralAvisoTopo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 12,
  },

  centralAvisoTitulo: {
    color: VINHO_ESCURO,
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 6,
  },

  centralLink: {
    marginTop: 10,
    paddingVertical: 8,
  },

  centralLinkTexto: {
    color: VINHO,
    fontSize: 12,
    fontWeight: "900",
  },

  centralAcoesGrid: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 12,
  },

  centralAcaoCard: {
    flexGrow: 1,
    flexBasis: 180,
    minHeight: 120,
    backgroundColor: BRANCO,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#EAE0E3",
    padding: 16,
  },

  centralAcaoSeta: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#F2E5E9",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-end",
  },

  centralAcaoSetaTexto: {
    color: VINHO,
    fontSize: 16,
    fontWeight: "900",
  },

  centralAcaoTitulo: {
    color: VINHO_ESCURO,
    fontSize: 15,
    fontWeight: "900",
    marginTop: 5,
  },

  centralAcaoDescricao: {
    color: "#786B70",
    fontSize: 10,
    lineHeight: 15,
    marginTop: 4,
  },

  offlineBanner: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#FFF3F4",
    borderWidth: 1,
    borderColor: "#EBC6CB",
    borderRadius: 15,
    padding: 12,
    marginBottom: 12,
  },

  offlinePonto: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: VERMELHO,
  },

  offlineTitulo: {
    color: VERMELHO,
    fontSize: 11,
    fontWeight: "900",
  },

  offlineTexto: {
    color: "#806D72",
    fontSize: 9,
    marginTop: 2,
  },

  adminUtilidades: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  buscaGlobalBox: {
    width: "100%",
    position: "relative",
    zIndex: 30,
    marginBottom: 12,
  },

  buscaGlobalInput: {
    width: "100%",
    minHeight: 48,
    backgroundColor: BRANCO,
    borderWidth: 1,
    borderColor: "#E4D7DB",
    borderRadius: 16,
    paddingHorizontal: 15,
    color: VINHO_ESCURO,
    fontSize: 13,
  },

  buscaGlobalResultados: {
    width: "100%",
    marginTop: 6,
    backgroundColor: BRANCO,
    borderWidth: 1,
    borderColor: "#E4D7DB",
    borderRadius: 16,
    padding: 8,
    shadowColor: "#390B18",
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 7,
  },

  buscaGlobalItem: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 10,
    borderRadius: 12,
  },

  buscaGlobalAvatar: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: "#F2E5E9",
    alignItems: "center",
    justifyContent: "center",
  },

  buscaGlobalAvatarTexto: {
    color: VINHO,
    fontSize: 14,
    fontWeight: "900",
  },

  buscaGlobalNome: {
    color: VINHO_ESCURO,
    fontSize: 12,
    fontWeight: "900",
  },

  buscaGlobalMeta: {
    color: "#83757A",
    fontSize: 9,
    marginTop: 2,
  },

  acoesInteligentesGrid: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 14,
  },

  acaoInteligenteCard: {
    flexGrow: 1,
    flexBasis: 160,
    minHeight: 150,
    borderRadius: 18,
    padding: 14,
    backgroundColor: "#FBF8F9",
    borderWidth: 1,
    borderColor: "#E9DEE2",
  },

  acaoInteligenteNumero: {
    color: VINHO_ESCURO,
    fontSize: 30,
    fontWeight: "900",
    marginTop: 13,
  },

  acaoInteligenteTitulo: {
    color: VINHO_ESCURO,
    fontSize: 13,
    fontWeight: "900",
    marginTop: 2,
  },

  acaoInteligenteDescricao: {
    color: "#81747A",
    fontSize: 9,
    marginTop: 3,
  },


  adminPageMobileComNav: {
    paddingBottom: 118,
  },

  mobileBottomNav: {
    position: "absolute",
    left: 10,
    right: 10,
    bottom: 10,
    minHeight: 70,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: "rgba(255,255,255,0.97)",
    borderWidth: 1,
    borderColor: "#E9DEE2",
    borderRadius: 24,
    paddingHorizontal: 6,
    paddingVertical: 8,
    shadowColor: "#3C0C19",
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },

  mobileBottomItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 54,
  },

  mobileBottomIcone: {
    minWidth: 31,
    height: 27,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  mobileBottomIconeAtivo: {
    backgroundColor: "#F3E5EA",
  },

  mobileBottomIconeTexto: {
    color: "#85777C",
    fontSize: 17,
    fontWeight: "900",
  },

  mobileBottomIconeTextoAtivo: {
    color: VINHO,
  },

  mobileBottomTexto: {
    color: "#8A7D82",
    fontSize: 8,
    fontWeight: "800",
    marginTop: 3,
  },

  mobileBottomTextoAtivo: {
    color: VINHO,
  },

  mobileBottomBadge: {
    position: "absolute",
    right: -4,
    top: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: VERMELHO,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },

  mobileBottomBadgeTexto: {
    color: BRANCO,
    fontSize: 8,
    fontWeight: "900",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(38, 10, 19, 0.48)",
    alignItems: "center",
    justifyContent: "center",
    padding: 22,
  },

  modalCard: {
    width: "100%",
    maxWidth: 430,
    backgroundColor: BRANCO,
    borderRadius: 26,
    padding: 24,
    alignItems: "center",
    shadowColor: "#2C0712",
    shadowOpacity: 0.25,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 14 },
    elevation: 12,
  },

  modalIcone: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#FFF0F1",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  modalIconeText: {
    color: VERMELHO,
    fontSize: 25,
    fontWeight: "900",
  },

  modalTitulo: {
    color: VINHO_ESCURO,
    fontSize: 21,
    fontWeight: "900",
    textAlign: "center",
  },

  modalMensagem: {
    color: "#74686C",
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    marginTop: 10,
  },

  modalAcoes: {
    width: "100%",
    flexDirection: "row",
    gap: 10,
    marginTop: 22,
  },

  modalCancelar: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#DED1D5",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FBF8F9",
  },

  modalCancelarTexto: {
    color: "#6D6065",
    fontSize: 13,
    fontWeight: "900",
  },

  modalConfirmar: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: VERMELHO,
  },

  modalConfirmarTexto: {
    color: BRANCO,
    fontSize: 13,
    fontWeight: "900",
  },

  skeletonCard: {
    width: "100%",
    minHeight: 135,
    backgroundColor: "#EEE6E9",
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
  },

  skeletonTitulo: {
    width: "42%",
    height: 15,
    borderRadius: 8,
    backgroundColor: "#D8CCD0",
    marginBottom: 18,
  },

  skeletonLinhaGrande: {
    width: "88%",
    height: 12,
    borderRadius: 7,
    backgroundColor: "#DED4D7",
    marginBottom: 10,
  },

  skeletonLinhaMedia: {
    width: "62%",
    height: 12,
    borderRadius: 7,
    backgroundColor: "#DED4D7",
  },

  skeletonLinha: {
    width: "100%",
    height: 52,
    borderRadius: 16,
    backgroundColor: "#E5DADD",
    marginVertical: 8,
  },

  toastCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: VERDE,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 9,
  },

  toastCheckText: {
    color: BRANCO,
    fontSize: 13,
    fontWeight: "900",
  },


  // =====================================================
  // CAMADA VISUAL 2026 — ANGEL TRANSPORTES
  // =====================================================

  statusChip: {
    alignSelf: "flex-start",
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 999,
    backgroundColor: "#F1ECEE",
    borderWidth: 1,
    borderColor: "#E3D9DC",
  },

  statusChipSucesso: {
    backgroundColor: "#EDF8F0",
    borderColor: "#CBE7D2",
  },

  statusChipAlerta: {
    backgroundColor: "#FFF8E8",
    borderColor: "#F0DCA9",
  },

  statusChipErro: {
    backgroundColor: "#FFF0F1",
    borderColor: "#EBC7CB",
  },

  statusChipTexto: {
    color: "#75686D",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.7,
  },

  statusChipTextoSucesso: {
    color: VERDE,
  },

  statusChipTextoAlerta: {
    color: AMARELO,
  },

  statusChipTextoErro: {
    color: VERMELHO,
  },

  emptyState: {
    width: "100%",
    minHeight: 135,
    alignItems: "center",
    justifyContent: "center",
    padding: 22,
    borderRadius: 18,
    backgroundColor: "#FBF8F9",
    borderWidth: 1,
    borderColor: "#EEE4E7",
    borderStyle: "dashed",
  },

  emptyStateIcone: {
    color: VINHO,
    fontSize: 26,
    fontWeight: "900",
    marginBottom: 7,
  },

  emptyStateTitulo: {
    color: VINHO_ESCURO,
    fontSize: 15,
    fontWeight: "900",
    marginBottom: 4,
    textAlign: "center",
  },


  feedbackBanner: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F2FBF4",
    borderWidth: 1,
    borderColor: "#C7E6CF",
    borderRadius: 16,
    paddingVertical: 11,
    paddingHorizontal: 12,
    marginBottom: 14,
    shadowColor: "#1D6B35",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },

  feedbackBannerTexto: {
    color: VERDE,
    fontSize: 12,
    fontWeight: "900",
  },

  sessaoBadge: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#FBF8F9",
    borderWidth: 1,
    borderColor: "#E9DEE2",
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 13,
    marginBottom: 14,
  },

  sessaoBolinha: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  sessaoTipo: {
    color: VINHO_ESCURO,
    fontSize: 11,
    fontWeight: "900",
  },

  sessaoEmail: {
    color: "#7A6D72",
    fontSize: 10,
    marginTop: 2,
  },

  historicoAlteracaoLinha: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 11,
    borderTopWidth: 1,
    borderTopColor: "#EEE3E7",
  },

  historicoAlteracaoAcao: {
    color: VINHO_ESCURO,
    fontSize: 12,
    fontWeight: "900",
  },

  historicoAlteracaoData: {
    color: "#8E8085",
    fontSize: 10,
    fontWeight: "700",
  },


  statusSistema: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    alignSelf: "flex-start",
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 99,
    marginBottom: 18,
    borderWidth: 1,
  },

  statusSistemaOnline: {
    backgroundColor: "#EFFAF2",
    borderColor: "#BDE4C7",
  },

  statusSistemaOffline: {
    backgroundColor: "#FFF0F2",
    borderColor: "#ECB6BF",
  },

  statusBolinha: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },

  statusSistemaTexto: {
    fontSize: 11,
    fontWeight: "900",
  },

  chipGerenciavel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F4E9ED",
    borderWidth: 1,
    borderColor: "#DFC8D0",
    borderRadius: 999,
    paddingLeft: 14,
    paddingRight: 5,
    paddingVertical: 5,
  },

  chipGerenciavelText: {
    color: VINHO_ESCURO,
    fontSize: 12,
    fontWeight: "800",
  },

  chipExcluirButton: {
    width: 27,
    height: 27,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#E4BFC6",
  },

  chipExcluirText: {
    color: VERMELHO,
    fontSize: 19,
    fontWeight: "900",
    lineHeight: 21,
  },

  botaoExcluirAviso: {
    width: "100%",
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: VERMELHO,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF7F7",
  },

  botaoExcluirAvisoTexto: {
    color: VERMELHO,
    fontSize: 14,
    fontWeight: "900",
  },

  rodapeCompleto: {
    width: "100%",
    alignItems: "center",
    marginTop: 28,
    paddingTop: 8,
    paddingBottom: 12,
  },

  rodapeDivisor: {
    width: "100%",
    height: 1,
    backgroundColor: "#E8DDE1",
    marginBottom: 22,
  },

  rodapeMarca: {
    color: VINHO_ESCURO,
    fontSize: 17,
    fontWeight: "900",
    marginBottom: 6,
  },

  rodapeDescricao: {
    color: "#75686C",
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    maxWidth: 430,
    marginBottom: 14,
  },

  rodapeSeparador: {
    color: "#B8A8AD",
    fontSize: 12,
    fontWeight: "800",
  },

  rodapeCopyright: {
    color: "#9A8B90",
    fontSize: 11,
    textAlign: "center",
    marginTop: 12,
  },

  termosAdminTopo: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    marginBottom: 14,
  },

  termosAdminContador: {
    minWidth: 72,
    backgroundColor: "#F4E9ED",
    borderWidth: 1,
    borderColor: "#DFC8D0",
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: "center",
  },

  termosAdminContadorNumero: {
    color: VINHO,
    fontSize: 24,
    fontWeight: "900",
    lineHeight: 27,
  },

  termosAdminContadorTexto: {
    color: "#7B6B70",
    fontSize: 10,
    fontWeight: "800",
  },

  termosAdminLinha: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#EEE3E7",
    paddingVertical: 12,
  },

  termosAdminNome: {
    color: VINHO_ESCURO,
    fontSize: 14,
    fontWeight: "900",
  },

  termosAdminEmail: {
    color: "#776B6F",
    fontSize: 11,
    marginTop: 3,
  },

  termosAdminDireita: {
    alignItems: "flex-end",
  },

  termosAdminStatus: {
    color: VERDE,
    fontSize: 10,
    fontWeight: "900",
  },

  termosAdminData: {
    color: "#665A5E",
    fontSize: 10,
    fontWeight: "700",
    marginTop: 3,
  },

  termosAdminVersao: {
    color: "#9A8B90",
    fontSize: 9,
    marginTop: 2,
  },

  termosContainer: {
    width: "100%",
    marginTop: 2,
    marginBottom: 16,
  },

  termosLinha: {
    width: "100%",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 11,
    paddingVertical: 4,
  },

  checkboxTermos: {
    width: 23,
    height: 23,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#C8B4BB",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },

  checkboxTermosAtivo: {
    backgroundColor: VINHO,
    borderColor: VINHO,
  },

  checkboxTermosCheck: {
    color: BRANCO,
    fontSize: 15,
    fontWeight: "900",
    lineHeight: 17,
  },

  termosTexto: {
    flex: 1,
    color: "#665A5E",
    fontSize: 12,
    lineHeight: 18,
  },

  termosLink: {
    color: VINHO,
    fontWeight: "900",
    textDecorationLine: "underline",
  },

  linksRodape: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 18,
    paddingTop: 6,
    paddingBottom: 4,
  },

  linkRodapeText: {
    color: VINHO,
    fontSize: 12,
    fontWeight: "800",
    textDecorationLine: "underline",
  },

  opcoesTransporte: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
    marginBottom: 18,
  },

  opcaoTransporte: {
    flexGrow: 1,
    minWidth: 120,
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: "#FAF6F8",
    borderWidth: 1,
    borderColor: "#E5D8DD",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },

  opcaoTransporteAtiva: {
    backgroundColor: VINHO,
    borderColor: VINHO,
  },

  opcaoTransporteTexto: {
    color: VINHO,
    fontSize: 12,
    fontWeight: "900",
  },

  opcaoTransporteTextoAtivo: {
    color: BRANCO,
  },

  graficoCardMobile: {
    paddingHorizontal: 14,
    paddingVertical: 22,
    overflow: "hidden",
  },

  graficoTituloMobile: {
    fontSize: 22,
    lineHeight: 28,
    marginBottom: 8,
  },

  graficoAnualMobile: {
    width: "100%",
    gap: 2,
    minHeight: 165,
    paddingTop: 12,
    paddingHorizontal: 0,
    alignSelf: "stretch",
  },

  graficoColunaAreaMobile: {
    flex: 1,
    minWidth: 0,
    width: 0,
  },

  graficoValorMobile: {
    fontSize: 7,
    lineHeight: 8,
    minHeight: 18,
    width: "100%",
  },

  graficoBaseMobile: {
    width: "62%",
    minWidth: 8,
    maxWidth: 18,
    height: 112,
    borderRadius: 8,
  },

  graficoMesMobile: {
    fontSize: 7,
    lineHeight: 10,
    marginTop: 6,
  },

  graficoAnual: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 6,
    minHeight: 180,
    paddingTop: 16,
  },

  graficoColunaArea: {
    flex: 1,
    minWidth: 28,
    alignItems: "center",
  },

  graficoValor: {
    color: "#776B6F",
    fontSize: 8,
    minHeight: 16,
    textAlign: "center",
  },

  graficoBase: {
    height: 125,
    width: "72%",
    justifyContent: "flex-end",
    backgroundColor: "#F1E8EB",
    borderRadius: 10,
    overflow: "hidden",
  },

  graficoBarra: {
    width: "100%",
    backgroundColor: VINHO,
    borderRadius: 10,
  },

  graficoMes: {
    color: "#665A5E",
    fontSize: 9,
    fontWeight: "800",
    marginTop: 7,
  },

  alertaLinha: {
    borderTopWidth: 1,
    borderTopColor: "#EEE3E7",
    paddingVertical: 12,
  },

  alertaTituloVermelho: {
    color: VERMELHO,
    fontWeight: "900",
    fontSize: 14,
  },

  alertaTituloAmarelo: {
    color: AMARELO,
    fontWeight: "900",
    fontSize: 14,
  },

  alertaDescricao: {
    color: "#776B6F",
    fontSize: 12,
    marginTop: 3,
  },

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

  botaoEditarResponsavel: {
    width: "100%",
    marginTop: 12,
    marginBottom: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "#F4E9ED",
    borderWidth: 1,
    borderColor: "#DFC8D0",
    alignItems: "center",
  },

  botaoEditarResponsavelTexto: {
    color: VINHO_ESCURO,
    fontSize: 14,
    fontWeight: "900",
  },

  observacaoResponsavelBox: {
    width: "100%",
    backgroundColor: "#FAF6F7",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E8DDE1",
    padding: 14,
    marginTop: 10,
    marginBottom: 10,
  },

  edicaoResponsavelCabecalho: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 12,
  },

  fecharEdicaoResponsavel: {
    color: VINHO,
    fontSize: 30,
    fontWeight: "700",
    lineHeight: 32,
    paddingHorizontal: 4,
  },

  botaoCancelarEdicao: {
    width: "100%",
    marginTop: 10,
    paddingVertical: 12,
    alignItems: "center",
  },

  botaoCancelarEdicaoTexto: {
    color: "#75686C",
    fontSize: 14,
    fontWeight: "800",
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
    width: "100%",
    minHeight: 390,
    backgroundColor: VINHO,
    borderBottomLeftRadius: 38,
    borderBottomRightRadius: 38,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 22,
    paddingTop: 36,
    paddingBottom: 54,
    overflow: "hidden",
  },

  heroMobile: {
    minHeight: 0,
    paddingTop: 32,
    paddingBottom: 34,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
  },

  logoImagemContainerMobile: {
    width: 108,
    height: 108,
    borderRadius: 30,
    marginBottom: 16,
  },

  titleMobile: {
    fontSize: 34,
    lineHeight: 39,
    letterSpacing: -0.6,
    maxWidth: 330,
  },

  subtitleMobile: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 10,
    maxWidth: 320,
    paddingHorizontal: 4,
  },

  mainMobile: {
    paddingHorizontal: 14,
    paddingBottom: 28,
    marginTop: 18,
  },

  cardMobile: {
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 24,
    marginBottom: 16,
  },

  cardTitleMobile: {
    fontSize: 28,
    lineHeight: 34,
  },

  infoTransporteWrapper: {
    width: "100%",
    marginTop: 2,
    marginBottom: 18,
  },

  infoTransporteWrapperMobile: {
    marginTop: 0,
    marginBottom: 18,
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
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 22,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#EEE5E8",
    shadowColor: "#4A1223",
    shadowOpacity: 0.07,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
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
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "900",
    letterSpacing: -0.4,
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
    color: "#51464A",
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "900",
    marginBottom: 7,
    letterSpacing: 0.15,
  },

  input: {
    width: "100%",
    minHeight: 52,
    borderWidth: 1,
    borderColor: "#DDD1D5",
    borderRadius: 15,
    backgroundColor: "#FCFAFB",
    paddingHorizontal: 15,
    paddingVertical: 12,
    color: VINHO_ESCURO,
    fontSize: 14,
    marginBottom: 14,
  },

  textArea: {
    minHeight: 130,
    height: 130,
    paddingTop: 16,
    textAlignVertical: "top",
  },

  botaoPrincipal: {
    width: "100%",
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: VINHO,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    paddingVertical: 14,
    marginTop: 7,
    shadowColor: VINHO,
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },

  botaoPrincipalTexto: {
    color: BRANCO,
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 0.2,
  },

  botaoSecundario: {
    width: "100%",
    minHeight: 50,
    borderRadius: 16,
    backgroundColor: "#FBF7F8",
    borderWidth: 1,
    borderColor: "#DCCAD0",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    paddingVertical: 13,
    marginTop: 7,
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
    maxWidth: 1180,
    alignSelf: "center",
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 110,
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
    width: "100%",
    backgroundColor: "#FBF8F9",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#EADFE3",
    padding: 17,
    marginBottom: 10,
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
    fontSize: 18,
    lineHeight: 23,
    fontWeight: "900",
    letterSpacing: -0.2,
    marginTop: 18,
    marginBottom: 10,
  },

  secaoTituloSemMargem: {
    color: VINHO_ESCURO,
    fontSize: 20,
    lineHeight: 25,
    fontWeight: "900",
    letterSpacing: -0.25,
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
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EEE4E7",
  },

  adminTab: {
    minHeight: 42,
    paddingHorizontal: 15,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F7F2F4",
    borderWidth: 1,
    borderColor: "#EEE4E7",
  },

  adminTabAtiva: {
    backgroundColor: VINHO,
    borderColor: VINHO,
    shadowColor: VINHO,
    shadowOpacity: 0.16,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
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
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
  },

  dashboardCard: {
    flexGrow: 1,
    flexBasis: 150,
    minHeight: 112,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 17,
    borderWidth: 1,
    borderColor: "#EDE3E6",
    justifyContent: "space-between",
    shadowColor: "#4A1223",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
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
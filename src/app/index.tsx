import { useEffect, useRef, useState } from "react";
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

// =====================================================
// TIPOS
// =====================================================

type Tela =
  | "inicio"
  | "menu"
  | "cadastro"
  | "perfil"
  | "sucesso"
  | "admin";

type RotaAdmin =
  | "alunos"
  | "pagamentos"
  | "calendario";

type StatusPagamento =
  | "pago"
  | "nao_pago";

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
};

// =====================================================
// APP PRINCIPAL
// =====================================================

export default function HomeScreen() {
  const [tela, setTela] =
    useState<Tela>("inicio");

  const [modo, setModo] =
    useState<"login" | "criar">("login");

  // =====================================================
  // ADMIN
  // =====================================================

  const [rotaAdmin, setRotaAdmin] =
    useState<RotaAdmin>("alunos");

  const [alunos, setAlunos] =
    useState<Aluno[]>([]);

  const [
    carregandoAlunos,
    setCarregandoAlunos,
  ] = useState(false);

  // =====================================================
  // ANIMAÇÕES
  // =====================================================

  const fadeAnim =
    useRef(new Animated.Value(0)).current;

  const slideAnim =
    useRef(new Animated.Value(35)).current;

  const logoAnim =
    useRef(new Animated.Value(0)).current;

  const brilhoAnim =
    useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(35);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 550,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),

      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 550,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [
    tela,
    rotaAdmin,
    fadeAnim,
    slideAnim,
  ]);

  useEffect(() => {
    const logoLoop =
      Animated.loop(
        Animated.sequence([
          Animated.timing(
            logoAnim,
            {
              toValue: -8,
              duration: 1600,
              easing:
                Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }
          ),

          Animated.timing(
            logoAnim,
            {
              toValue: 0,
              duration: 1600,
              easing:
                Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }
          ),
        ])
      );

    const brilhoLoop =
      Animated.loop(
        Animated.sequence([
          Animated.timing(
            brilhoAnim,
            {
              toValue: 1,
              duration: 2200,
              useNativeDriver: true,
            }
          ),

          Animated.timing(
            brilhoAnim,
            {
              toValue: 0,
              duration: 2200,
              useNativeDriver: true,
            }
          ),
        ])
      );

    logoLoop.start();
    brilhoLoop.start();

    return () => {
      logoLoop.stop();
      brilhoLoop.stop();
    };
  }, [
    logoAnim,
    brilhoAnim,
  ]);

  // =====================================================
  // CONTA
  // =====================================================

  const [
    nomeUsuario,
    setNomeUsuario,
  ] = useState("");

  const [
    email,
    setEmail,
  ] = useState("");

  const [
    senha,
    setSenha,
  ] = useState("");

  const [
    confirmarSenha,
    setConfirmarSenha,
  ] = useState("");

  const [
    carregando,
    setCarregando,
  ] = useState(false);

  // =====================================================
  // CADASTRO DA CRIANÇA
  // =====================================================

  const [
    nomeAluno,
    setNomeAluno,
  ] = useState("");

  const [
    nomeResponsavel,
    setNomeResponsavel,
  ] = useState("");

  const [
    telefone,
    setTelefone,
  ] = useState("");

  const [
    bairro,
    setBairro,
  ] = useState("");

  const [
    escola,
    setEscola,
  ] = useState("");

  const [
    turno,
    setTurno,
  ] = useState("");

  const [
    salvando,
    setSalvando,
  ] = useState(false);

  const [
    cadastroId,
    setCadastroId,
  ] = useState("");

  // =====================================================
  // PERFIL
  // =====================================================

  const [
    meusAlunos,
    setMeusAlunos,
  ] = useState<Aluno[]>([]);

  const [
    carregandoPerfil,
    setCarregandoPerfil,
  ] = useState(false);

  // =====================================================
  // PAGAMENTOS
  // =====================================================

  const [
    pagamentos,
    setPagamentos,
  ] = useState<Pagamento[]>([]);

  const [
    carregandoPagamentos,
    setCarregandoPagamentos,
  ] = useState(false);

  const [
    mesSelecionado,
    setMesSelecionado,
  ] = useState(new Date());

  const mesAtual =
    mesSelecionado.getMonth() + 1;

  const anoAtual =
    mesSelecionado.getFullYear();

  // =====================================================
  // LOGIN
  // =====================================================

  async function fazerLogin() {
    if (
      !email.trim() ||
      !senha.trim()
    ) {
      Alert.alert(
        "Atenção",
        "Preencha o e-mail e a senha."
      );

      return;
    }

    try {
      setCarregando(true);

      const credencial =
        await signInWithEmailAndPassword(
          auth,
          email
            .trim()
            .toLowerCase(),
          senha
        );

      const emailLogado =
        credencial.user.email
          ?.toLowerCase()
          .trim();

      if (
        emailLogado ===
        EMAIL_ADMIN
      ) {
        setRotaAdmin("alunos");
        setTela("admin");
        return;
      }

      setTela("menu");
    } catch (error: any) {
      console.log(
        "ERRO LOGIN:",
        error
      );

      let mensagem =
        "Não foi possível entrar.";

      if (
        error.code ===
          "auth/invalid-credential" ||
        error.code ===
          "auth/user-not-found" ||
        error.code ===
          "auth/wrong-password"
      ) {
        mensagem =
          "E-mail ou senha incorretos.";
      } else if (
        error.code ===
        "auth/invalid-email"
      ) {
        mensagem =
          "Digite um e-mail válido.";
      }

      Alert.alert(
        "Erro no login",
        mensagem
      );
    } finally {
      setCarregando(false);
    }
  }

  // =====================================================
  // CRIAR CONTA
  // =====================================================

  async function criarConta() {
    if (
      !nomeUsuario.trim() ||
      !email.trim() ||
      !senha.trim() ||
      !confirmarSenha.trim()
    ) {
      Alert.alert(
        "Atenção",
        "Preencha todos os campos."
      );

      return;
    }

    if (
      senha.length < 6
    ) {
      Alert.alert(
        "Senha inválida",
        "A senha precisa ter pelo menos 6 caracteres."
      );

      return;
    }

    if (
      senha !==
      confirmarSenha
    ) {
      Alert.alert(
        "Atenção",
        "As senhas não são iguais."
      );

      return;
    }

    try {
      setCarregando(true);

      const credencial =
        await createUserWithEmailAndPassword(
          auth,
          email
            .trim()
            .toLowerCase(),
          senha
        );

      await setDoc(
        doc(
          db,
          "users",
          credencial.user.uid
        ),
        {
          name:
            nomeUsuario.trim(),

          email:
            credencial.user.email,

          role:
            "responsavel",

          criadoEm:
            serverTimestamp(),
        }
      );

      setSenha("");
      setConfirmarSenha("");

      Alert.alert(
        "Conta registrada!",
        "Sua conta foi criada com sucesso."
      );

      setTela(
        "cadastro"
      );
    } catch (error: any) {
      console.log(
        "ERRO CONTA:",
        error
      );

      let mensagem =
        "Não foi possível criar a conta.";

      if (
        error.code ===
        "auth/email-already-in-use"
      ) {
        mensagem =
          "Esse e-mail já possui uma conta.";
      }

      Alert.alert(
        "Erro",
        mensagem
      );
    } finally {
      setCarregando(false);
    }
  }

  // =====================================================
  // CADASTRAR ALUNO
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
      Alert.alert(
        "Atenção",
        "Preencha todos os campos."
      );

      return;
    }

    try {
      setSalvando(true);

      const usuario =
        auth.currentUser;

      if (!usuario) {
        Alert.alert(
          "Sessão encerrada",
          "Faça login novamente."
        );

        setTela(
          "inicio"
        );

        return;
      }

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

            criadoEm:
              serverTimestamp(),
          }
        );

      setCadastroId(
        documento.id
      );

      setTela(
        "sucesso"
      );
    } catch (error) {
      console.log(
        "ERRO ALUNO:",
        error
      );

      Alert.alert(
        "Erro",
        "Não foi possível cadastrar a criança."
      );
    } finally {
      setSalvando(false);
    }
  }

  // =====================================================
  // MEUS ALUNOS
  // =====================================================

  async function buscarMeusAlunos() {
    try {
      setCarregandoPerfil(
        true
      );

      const usuario =
        auth.currentUser;

      if (!usuario) {
        return;
      }

      const consulta =
        query(
          collection(
            db,
            "alunos"
          ),

          where(
            "usuarioUid",
            "==",
            usuario.uid
          )
        );

      const resposta =
        await getDocs(
          consulta
        );

      const lista: Aluno[] =
        resposta.docs.map(
          (item) => {
            const dados =
              item.data();

            return {
              id:
                item.id,

              nomeAluno:
                dados.nomeAluno,

              nomeResponsavel:
                dados.nomeResponsavel,

              telefone:
                dados.telefone,

              bairro:
                dados.bairro,

              escola:
                dados.escola,

              turno:
                dados.turno,

              usuarioEmail:
                dados.usuarioEmail,

              usuarioUid:
                dados.usuarioUid,
            };
          }
        );

      setMeusAlunos(
        lista
      );
    } finally {
      setCarregandoPerfil(
        false
      );
    }
  }

  // =====================================================
  // TODOS OS ALUNOS
  // =====================================================

  async function buscarAlunos() {
    try {
      setCarregandoAlunos(
        true
      );

      const resposta =
        await getDocs(
          collection(
            db,
            "alunos"
          )
        );

      const lista: Aluno[] =
        resposta.docs.map(
          (item) => {
            const dados =
              item.data();

            return {
              id:
                item.id,

              nomeAluno:
                dados.nomeAluno,

              nomeResponsavel:
                dados.nomeResponsavel,

              telefone:
                dados.telefone,

              bairro:
                dados.bairro,

              escola:
                dados.escola,

              turno:
                dados.turno,

              usuarioEmail:
                dados.usuarioEmail,

              usuarioUid:
                dados.usuarioUid,
            };
          }
        );

      setAlunos(lista);
    } finally {
      setCarregandoAlunos(
        false
      );
    }
  }

  // =====================================================
  // PAGAMENTOS
  // =====================================================

  async function buscarPagamentos() {
    try {
      setCarregandoPagamentos(
        true
      );

      const consulta =
        query(
          collection(
            db,
            "pagamentos"
          ),

          where(
            "mes",
            "==",
            mesAtual
          ),

          where(
            "ano",
            "==",
            anoAtual
          )
        );

      const resposta =
        await getDocs(
          consulta
        );

      const lista: Pagamento[] =
        resposta.docs.map(
          (item) => {
            const dados =
              item.data();

            return {
              id:
                item.id,

              alunoId:
                dados.alunoId,

              nomeAluno:
                dados.nomeAluno,

              status:
                dados.status ||
                "nao_pago",

              mes:
                dados.mes,

              ano:
                dados.ano,

              dataPagamento:
                dados.dataPagamento,

              dataVencimento:
                dados.dataVencimento,
            };
          }
        );

      setPagamentos(
        lista
      );
    } finally {
      setCarregandoPagamentos(
        false
      );
    }
  }

  // =====================================================
  // ALTERAR PAGAMENTO
  // =====================================================

  async function alterarPagamento(
    aluno: Aluno,
    status: StatusPagamento
  ) {
    try {
      const id =
        `${aluno.id}_${anoAtual}_${mesAtual}`;

      await setDoc(
        doc(
          db,
          "pagamentos",
          id
        ),
        {
          alunoId:
            aluno.id,

          nomeAluno:
            aluno.nomeAluno || "",

          status,

          mes:
            mesAtual,

          ano:
            anoAtual,

          dataPagamento:
            status ===
            "pago"
              ? serverTimestamp()
              : null,

          atualizadoEm:
            serverTimestamp(),
        },
        {
          merge: true,
        }
      );

      await buscarPagamentos();
    } catch (error) {
      Alert.alert(
        "Erro",
        "Não foi possível atualizar o pagamento."
      );
    }
  }

  // =====================================================
  // DATA VENCIMENTO
  // =====================================================

  async function salvarDataVencimento(
    aluno: Aluno,
    dataVencimento: string
  ) {
    if (
      !dataVencimento.trim()
    ) {
      Alert.alert(
        "Atenção",
        "Digite a data de vencimento."
      );

      return;
    }

    try {
      const id =
        `${aluno.id}_${anoAtual}_${mesAtual}`;

      const existente =
        pagamentos.find(
          (item) =>
            item.alunoId ===
            aluno.id
        );

      await setDoc(
        doc(
          db,
          "pagamentos",
          id
        ),
        {
          alunoId:
            aluno.id,

          nomeAluno:
            aluno.nomeAluno ||
            "",

          status:
            existente?.status ||
            "nao_pago",

          mes:
            mesAtual,

          ano:
            anoAtual,

          dataVencimento:
            dataVencimento.trim(),

          atualizadoEm:
            serverTimestamp(),
        },
        {
          merge: true,
        }
      );

      await buscarPagamentos();

      Alert.alert(
        "Data salva!",
        "Data de vencimento atualizada."
      );
    } catch {
      Alert.alert(
        "Erro",
        "Não foi possível salvar a data."
      );
    }
  }

  // =====================================================
  // MÊS
  // =====================================================

  function mesAnterior() {
    setMesSelecionado(
      new Date(
        anoAtual,
        mesAtual - 2,
        1
      )
    );
  }

  function proximoMes() {
    setMesSelecionado(
      new Date(
        anoAtual,
        mesAtual,
        1
      )
    );
  }

  // =====================================================
  // FIREBASE AUTOMÁTICO
  // =====================================================

  useEffect(() => {
    if (
      tela === "perfil"
    ) {
      buscarMeusAlunos();
    }

    if (
      tela === "admin"
    ) {
      buscarAlunos();
    }
  }, [tela]);

  useEffect(() => {
    if (
      tela === "admin" &&
      (
        rotaAdmin ===
          "pagamentos" ||
        rotaAdmin ===
          "calendario"
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
  // LIMPAR
  // =====================================================

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
  // SAIR
  // =====================================================

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
  // LOGIN
  // =====================================================

  if (
    tela === "inicio"
  ) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
      >
        <ScrollView
          contentContainerStyle={
            styles.content
          }
          keyboardShouldPersistTaps="handled"
        >
          <View
            style={styles.hero}
          >
            <Animated.View
              style={[
                styles.bolhaGrande,
                {
                  opacity:
                    brilhoAnim.interpolate({
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
                  opacity:
                    brilhoAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.08, 0.3],
                    }),
                },
              ]}
            />

            {/* LOGO NOVA */}

            <Animated.View
              style={[
                styles.logoImagemContainer,
                {
                  transform: [
                    {
                      translateY:
                        logoAnim,
                    },
                  ],
                },
              ]}
            >
              <Image
                source={require("../../assets/images/logo-at.png")}
                style={
                  styles.logoImagem
                }
                resizeMode="contain"
              />
            </Animated.View>

            <Text
              style={
                styles.title
              }
            >
              Angel Transports
            </Text>

            <Text
              style={
                styles.subtitle
              }
            >
              Transporte escolar com segurança e organização
            </Text>
          </View>

          <Animated.View
            style={[
              styles.main,
              {
                opacity:
                  fadeAnim,

                transform: [
                  {
                    translateY:
                      slideAnim,
                  },
                ],
              },
            ]}
          >
            <View
              style={
                styles.card
              }
            >
              <Text
                style={
                  styles.tag
                }
              >
                ACESSO AO SISTEMA
              </Text>

              <Text
                style={
                  styles.cardTitle
                }
              >
                {modo === "login"
                  ? "Bem-vindo"
                  : "Criar conta"}
              </Text>

              <Text
                style={
                  styles.descricao
                }
              >
                {modo === "login"
                  ? "Entre com sua conta para continuar."
                  : "Crie sua conta e faça o cadastro da criança."}
              </Text>

              <View
                style={
                  styles.tabs
                }
              >
                <TouchableOpacity
                  style={[
                    styles.tab,
                    modo ===
                      "login" &&
                      styles.tabAtiva,
                  ]}
                  onPress={() =>
                    setModo("login")
                  }
                >
                  <Text
                    style={[
                      styles.tabText,
                      modo ===
                        "login" &&
                        styles.tabTextAtiva,
                    ]}
                  >
                    Entrar
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.tab,
                    modo ===
                      "criar" &&
                      styles.tabAtiva,
                  ]}
                  onPress={() =>
                    setModo("criar")
                  }
                >
                  <Text
                    style={[
                      styles.tabText,
                      modo ===
                        "criar" &&
                        styles.tabTextAtiva,
                    ]}
                  >
                    Criar conta
                  </Text>
                </TouchableOpacity>
              </View>

              {modo === "criar" && (
                <Campo
                  label="Nome"
                  value={
                    nomeUsuario
                  }
                  onChange={
                    setNomeUsuario
                  }
                  placeholder="Digite seu nome"
                />
              )}

              <Campo
                label="E-mail"
                value={email}
                onChange={
                  setEmail
                }
                placeholder="Digite seu e-mail"
                email
              />

              <Text
                style={
                  styles.label
                }
              >
                Senha
              </Text>

              <TextInput
                style={
                  styles.input
                }
                value={senha}
                onChangeText={
                  setSenha
                }
                placeholder="Digite sua senha"
                placeholderTextColor="#9C8F92"
                secureTextEntry
              />

              {modo === "criar" && (
                <>
                  <Text
                    style={
                      styles.label
                    }
                  >
                    Confirmar senha
                  </Text>

                  <TextInput
                    style={
                      styles.input
                    }
                    value={
                      confirmarSenha
                    }
                    onChangeText={
                      setConfirmarSenha
                    }
                    placeholder="Digite novamente"
                    placeholderTextColor="#9C8F92"
                    secureTextEntry
                  />
                </>
              )}

              <BotaoAnimado
                texto={
                  modo === "login"
                    ? "Entrar no sistema"
                    : "Criar minha conta"
                }
                carregando={
                  carregando
                }
                onPress={
                  modo === "login"
                    ? fazerLogin
                    : criarConta
                }
              />
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // =====================================================
  // MENU
  // =====================================================

  if (
    tela === "menu"
  ) {
    return (
      <View
        style={
          styles.center
        }
      >
        <Animated.View
          style={[
            styles.cardGrande,
            {
              opacity:
                fadeAnim,

              transform: [
                {
                  translateY:
                    slideAnim,
                },
              ],
            },
          ]}
        >
          {/* LOGO NO MENU */}

          <Animated.View
            style={[
              styles.menuLogoImagemContainer,
              {
                transform: [
                  {
                    translateY:
                      logoAnim,
                  },
                ],
              },
            ]}
          >
            <Image
              source={require("../../assets/images/logo-at.png")}
              style={
                styles.menuLogoImagem
              }
              resizeMode="contain"
            />
          </Animated.View>

          <Text
            style={
              styles.tag
            }
          >
            ANGEL TRANSPORTS
          </Text>

          <Text
            style={
              styles.cardTitle
            }
          >
            O que deseja fazer?
          </Text>

          <Text
            style={
              styles.descricao
            }
          >
            Escolha uma opção para continuar.
          </Text>

          <BotaoAnimado
            texto="Cadastrar criança"
            onPress={() =>
              setTela(
                "cadastro"
              )
            }
          />

          <BotaoAnimado
            texto="Ver meu perfil"
            secundario
            onPress={() =>
              setTela(
                "perfil"
              )
            }
          />

          <TouchableOpacity
            style={
              styles.linkButton
            }
            onPress={
              sair
            }
          >
            <Text
              style={
                styles.linkText
              }
            >
              Sair da conta
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  // =====================================================
  // PERFIL
  // =====================================================

  if (
    tela === "perfil"
  ) {
    return (
      <ScrollView
        style={
          styles.container
        }
        contentContainerStyle={
          styles.page
        }
      >
        <HeaderPagina
          titulo="Minhas crianças"
          subtitulo="Veja as crianças cadastradas pela sua conta."
          voltar={() =>
            setTela(
              "menu"
            )
          }
        />

        {carregandoPerfil ? (
          <ActivityIndicator
            size="large"
            color={VINHO}
          />
        ) : meusAlunos.length === 0 ? (
          <Vazio
            texto="Nenhuma criança cadastrada."
          />
        ) : (
          meusAlunos.map(
            (aluno, index) => (
              <CardAnimado
                key={
                  aluno.id
                }
                delay={
                  index * 90
                }
              >
                <AlunoCard
                  aluno={
                    aluno
                  }
                />
              </CardAnimado>
            )
          )
        )}
      </ScrollView>
    );
  }

  // =====================================================
  // CADASTRO
  // =====================================================

  if (
    tela === "cadastro"
  ) {
    return (
      <ScrollView
        style={
          styles.container
        }
        contentContainerStyle={
          styles.page
        }
        keyboardShouldPersistTaps="handled"
      >
        <HeaderPagina
          titulo="Cadastro da criança"
          subtitulo="Preencha os dados abaixo."
          voltar={() =>
            setTela(
              "menu"
            )
          }
        />

        <Animated.View
          style={[
            styles.card,
            {
              opacity:
                fadeAnim,

              transform: [
                {
                  translateY:
                    slideAnim,
                },
              ],
            },
          ]}
        >
          <Campo
            label="Nome da criança"
            value={nomeAluno}
            onChange={
              setNomeAluno
            }
            placeholder="Nome completo"
          />

          <Campo
            label="Nome do responsável"
            value={
              nomeResponsavel
            }
            onChange={
              setNomeResponsavel
            }
            placeholder="Nome do responsável"
          />

          <Campo
            label="Telefone"
            value={
              telefone
            }
            onChange={
              setTelefone
            }
            placeholder="(00) 00000-0000"
          />

          <Campo
            label="Bairro"
            value={
              bairro
            }
            onChange={
              setBairro
            }
            placeholder="Digite o bairro"
          />

          <Campo
            label="Escola"
            value={
              escola
            }
            onChange={
              setEscola
            }
            placeholder="Digite a escola"
          />

          <Campo
            label="Turno"
            value={
              turno
            }
            onChange={
              setTurno
            }
            placeholder="Ex: Manhã"
          />

          <BotaoAnimado
            texto="Cadastrar criança"
            carregando={
              salvando
            }
            onPress={
              cadastrarAluno
            }
          />
        </Animated.View>
      </ScrollView>
    );
  }

  // =====================================================
  // SUCESSO
  // =====================================================

  if (
    tela === "sucesso"
  ) {
    return (
      <View
        style={
          styles.center
        }
      >
        <Animated.View
          style={[
            styles.cardGrande,
            {
              opacity:
                fadeAnim,

              transform: [
                {
                  translateY:
                    slideAnim,
                },
              ],
            },
          ]}
        >
          <View
            style={
              styles.checkCircle
            }
          >
            <Text
              style={
                styles.check
              }
            >
              ✓
            </Text>
          </View>

          <Text
            style={
              styles.sucessoTitle
            }
          >
            Criança cadastrada!
          </Text>

          <Text
            style={
              styles.centerText
            }
          >
            {nomeAluno} foi cadastrado com sucesso e salvo no Firebase.
          </Text>

          <View
            style={
              styles.idBox
            }
          >
            <Text
              style={
                styles.idLabel
              }
            >
              ID do cadastro
            </Text>

            <Text
              style={
                styles.idText
              }
            >
              {cadastroId}
            </Text>
          </View>

          <BotaoAnimado
            texto="Cadastrar outra criança"
            onPress={() => {
              limparCadastro();

              setTela(
                "cadastro"
              );
            }}
          />

          <BotaoAnimado
            texto="Ver meu perfil"
            secundario
            onPress={() => {
              limparCadastro();

              setTela(
                "perfil"
              );
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
      style={
        styles.container
      }
      contentContainerStyle={
        styles.adminPage
      }
    >
      <Animated.View
        style={[
          styles.adminTop,
          {
            opacity:
              fadeAnim,

            transform: [
              {
                translateY:
                  slideAnim,
              },
            ],
          },
        ]}
      >
        <View>
          <Text
            style={
              styles.tag
            }
          >
            ADMINISTRADOR
          </Text>

          <Text
            style={
              styles.adminTitle
            }
          >
            Angel Transports
          </Text>

          <Text
            style={
              styles.adminSub
            }
          >
            Gerencie alunos e pagamentos
          </Text>
        </View>

        <TouchableOpacity
          style={
            styles.sairButton
          }
          onPress={
            sair
          }
        >
          <Text
            style={
              styles.sairButtonText
            }
          >
            Sair
          </Text>
        </TouchableOpacity>
      </Animated.View>

      <View
        style={
          styles.adminTabs
        }
      >
        <AdminTab
          texto="Alunos"
          ativo={
            rotaAdmin ===
            "alunos"
          }
          onPress={() =>
            setRotaAdmin(
              "alunos"
            )
          }
        />

        <AdminTab
          texto="Pagamentos"
          ativo={
            rotaAdmin ===
            "pagamentos"
          }
          onPress={() =>
            setRotaAdmin(
              "pagamentos"
            )
          }
        />

        <AdminTab
          texto="Calendário"
          ativo={
            rotaAdmin ===
            "calendario"
          }
          onPress={() =>
            setRotaAdmin(
              "calendario"
            )
          }
        />
      </View>

      {rotaAdmin === "alunos" && (
        <>
          <View
            style={
              styles.resumo
            }
          >
            <Text
              style={
                styles.resumoNumero
              }
            >
              {alunos.length}
            </Text>

            <Text
              style={
                styles.resumoTexto
              }
            >
              alunos cadastrados
            </Text>
          </View>

          {carregandoAlunos ? (
            <ActivityIndicator
              size="large"
              color={VINHO}
            />
          ) : (
            alunos.map(
              (aluno, index) => (
                <CardAnimado
                  key={
                    aluno.id
                  }
                  delay={
                    index * 80
                  }
                >
                  <AlunoCard
                    aluno={
                      aluno
                    }
                  />
                </CardAnimado>
              )
            )
          )}
        </>
      )}

      {rotaAdmin ===
        "pagamentos" && (
        <>
          <SeletorMes
            data={
              mesSelecionado
            }
            anterior={
              mesAnterior
            }
            proximo={
              proximoMes
            }
          />

          <Text
            style={
              styles.pagamentoExplicacao
            }
          >
            Marque quem pagou e defina a data de vencimento de cada aluno.
          </Text>

          {carregandoPagamentos ? (
            <ActivityIndicator
              size="large"
              color={VINHO}
            />
          ) : (
            alunos.map(
              (aluno, index) => {
                const pagamento =
                  pagamentos.find(
                    (item) =>
                      item.alunoId ===
                      aluno.id
                  );

                return (
                  <CardAnimado
                    key={
                      aluno.id
                    }
                    delay={
                      index * 80
                    }
                  >
                    <PagamentoCard
                      aluno={
                        aluno
                      }
                      pagamento={
                        pagamento
                      }
                      alterar={
                        alterarPagamento
                      }
                      salvarData={
                        salvarDataVencimento
                      }
                    />
                  </CardAnimado>
                );
              }
            )
          )}
        </>
      )}

      {rotaAdmin ===
        "calendario" && (
        <>
          <SeletorMes
            data={
              mesSelecionado
            }
            anterior={
              mesAnterior
            }
            proximo={
              proximoMes
            }
          />

          <CalendarioPagamentos
            data={
              mesSelecionado
            }
            pagamentos={
              pagamentos
            }
          />
        </>
      )}
    </ScrollView>
  );
}

// =====================================================
// BOTÃO ANIMADO
// =====================================================

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
  const escala =
    useRef(
      new Animated.Value(1)
    ).current;

  return (
    <Animated.View
      style={{
        width: "100%",
        transform: [
          {
            scale:
              escala,
          },
        ],
      }}
    >
      <TouchableOpacity
        style={
          secundario
            ? styles.botaoSecundario
            : styles.botaoPrincipal
        }
        onPress={
          onPress
        }
        onPressIn={() => {
          Animated.spring(
            escala,
            {
              toValue: 0.96,
              useNativeDriver: true,
            }
          ).start();
        }}
        onPressOut={() => {
          Animated.spring(
            escala,
            {
              toValue: 1,
              useNativeDriver: true,
            }
          ).start();
        }}
        disabled={
          carregando
        }
      >
        {carregando ? (
          <ActivityIndicator
            color={
              secundario
                ? VINHO
                : BRANCO
            }
          />
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

// =====================================================
// CARD ANIMADO
// =====================================================

function CardAnimado({
  children,
  delay = 0,
}: {
  children: ReactNode;
  delay?: number;
}) {
  const opacity =
    useRef(
      new Animated.Value(0)
    ).current;

  const movimento =
    useRef(
      new Animated.Value(25)
    ).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(
        opacity,
        {
          toValue: 1,
          duration: 450,
          delay,
          useNativeDriver: true,
        }
      ),

      Animated.timing(
        movimento,
        {
          toValue: 0,
          duration: 450,
          delay,
          useNativeDriver: true,
        }
      ),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={{
        opacity,
        transform: [
          {
            translateY:
              movimento,
          },
        ],
      }}
    >
      {children}
    </Animated.View>
  );
}

// =====================================================
// PAGAMENTO
// =====================================================

function PagamentoCard({
  aluno,
  pagamento,
  alterar,
  salvarData,
}: {
  aluno: Aluno;
  pagamento?: Pagamento;

  alterar: (
    aluno: Aluno,
    status: StatusPagamento
  ) => Promise<void>;

  salvarData: (
    aluno: Aluno,
    data: string
  ) => Promise<void>;
}) {
  const [
    data,
    setData,
  ] = useState(
    pagamento?.dataVencimento ||
      ""
  );

  useEffect(() => {
    setData(
      pagamento?.dataVencimento ||
        ""
    );
  }, [
    pagamento?.dataVencimento,
  ]);

  const pago =
    pagamento?.status ===
    "pago";

  return (
    <View
      style={[
        styles.pagamentoCard,

        pago
          ? styles.pagamentoVerde
          : styles.pagamentoVermelho,
      ]}
    >
      <Text
        style={
          styles.pagamentoNome
        }
      >
        {aluno.nomeAluno}
      </Text>

      <Text
        style={
          styles.pagamentoEscola
        }
      >
        {aluno.escola}
      </Text>

      <View
        style={
          styles.switchArea
        }
      >
        <Text
          style={
            !pago
              ? styles.statusNaoPago
              : styles.statusDesativado
          }
        >
          Não pagou
        </Text>

        <Switch
          value={
            pago
          }
          onValueChange={(
            valor
          ) =>
            alterar(
              aluno,
              valor
                ? "pago"
                : "nao_pago"
            )
          }
        />

        <Text
          style={
            pago
              ? styles.statusPago
              : styles.statusDesativado
          }
        >
          Pagou
        </Text>
      </View>

      <Text
        style={
          styles.label
        }
      >
        Data de vencimento
      </Text>

      <TextInput
        style={
          styles.input
        }
        placeholder="Ex: 25/08/2026"
        value={
          data
        }
        onChangeText={
          setData
        }
      />

      <BotaoAnimado
        texto="Salvar data"
        onPress={() =>
          salvarData(
            aluno,
            data
          )
        }
      />
    </View>
  );
}

// =====================================================
// CALENDÁRIO
// =====================================================

function CalendarioPagamentos({
  data,
  pagamentos,
}: {
  data: Date;
  pagamentos: Pagamento[];
}) {
  const ano =
    data.getFullYear();

  const mes =
    data.getMonth();

  const dias =
    new Date(
      ano,
      mes + 1,
      0
    ).getDate();

  const primeiro =
    new Date(
      ano,
      mes,
      1
    ).getDay();

  return (
    <View
      style={
        styles.calendario
      }
    >
      <Text
        style={
          styles.calendarioTitulo
        }
      >
        Calendário de pagamentos
      </Text>

      <View
        style={
          styles.diasSemana
        }
      >
        {[
          "D",
          "S",
          "T",
          "Q",
          "Q",
          "S",
          "S",
        ].map(
          (
            item,
            index
          ) => (
            <Text
              key={
                index
              }
              style={
                styles.diaSemana
              }
            >
              {item}
            </Text>
          )
        )}
      </View>

      <View
        style={
          styles.grade
        }
      >
        {Array.from({
          length:
            primeiro,
        }).map(
          (_, i) => (
            <View
              key={`v${i}`}
              style={
                styles.dia
              }
            />
          )
        )}

        {Array.from(
          {
            length:
              dias,
          },
          (_, i) =>
            i + 1
        ).map(
          (dia) => (
            <View
              key={
                dia
              }
              style={
                styles.dia
              }
            >
              <Text
                style={
                  styles.numeroDia
                }
              >
                {dia}
              </Text>
            </View>
          )
        )}
      </View>
    </View>
  );
}

// =====================================================
// SELETOR MÊS
// =====================================================

function SeletorMes({
  data,
  anterior,
  proximo,
}: {
  data: Date;
  anterior: () => void;
  proximo: () => void;
}) {
  const texto =
    data.toLocaleDateString(
      "pt-BR",
      {
        month: "long",
        year: "numeric",
      }
    );

  return (
    <View
      style={
        styles.seletorMes
      }
    >
      <TouchableOpacity
        style={
          styles.mesButton
        }
        onPress={
          anterior
        }
      >
        <Text
          style={
            styles.mesButtonText
          }
        >
          ‹
        </Text>
      </TouchableOpacity>

      <Text
        style={
          styles.mesTitulo
        }
      >
        {texto}
      </Text>

      <TouchableOpacity
        style={
          styles.mesButton
        }
        onPress={
          proximo
        }
      >
        <Text
          style={
            styles.mesButtonText
          }
        >
          ›
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// =====================================================
// COMPONENTES
// =====================================================

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
      style={[
        styles.adminTab,

        ativo &&
          styles.adminTabAtiva,
      ]}
      onPress={
        onPress
      }
    >
      <Text
        style={[
          styles.adminTabTexto,

          ativo &&
            styles.adminTabTextoAtivo,
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
  onChange: (
    texto: string
  ) => void;
  placeholder: string;
  email?: boolean;
}) {
  return (
    <>
      <Text
        style={
          styles.label
        }
      >
        {label}
      </Text>

      <TextInput
        style={
          styles.input
        }
        value={
          value
        }
        onChangeText={
          onChange
        }
        placeholder={
          placeholder
        }
        placeholderTextColor="#9C8F92"
        keyboardType={
          email
            ? "email-address"
            : "default"
        }
        autoCapitalize={
          email
            ? "none"
            : "sentences"
        }
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
    <View
      style={
        styles.pageHeader
      }
    >
      <View>
        <Text
          style={
            styles.tag
          }
        >
          ANGEL TRANSPORTS
        </Text>

        <Text
          style={
            styles.pageTitle
          }
        >
          {titulo}
        </Text>

        <Text
          style={
            styles.pageSubtitulo
          }
        >
          {subtitulo}
        </Text>
      </View>

      <TouchableOpacity
        style={
          styles.sairButton
        }
        onPress={
          voltar
        }
      >
        <Text
          style={
            styles.sairButtonText
          }
        >
          Voltar
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function AlunoCard({
  aluno,
}: {
  aluno: Aluno;
}) {
  return (
    <View
      style={
        styles.alunoCard
      }
    >
      <Text
        style={
          styles.alunoNome
        }
      >
        {aluno.nomeAluno}
      </Text>

      <Info
        titulo="Responsável"
        valor={
          aluno.nomeResponsavel
        }
      />

      <Info
        titulo="Telefone"
        valor={
          aluno.telefone
        }
      />

      <Info
        titulo="Bairro"
        valor={
          aluno.bairro
        }
      />

      <Info
        titulo="Escola"
        valor={
          aluno.escola
        }
      />

      <Info
        titulo="Turno"
        valor={
          aluno.turno
        }
      />
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
    <View
      style={
        styles.info
      }
    >
      <Text
        style={
          styles.infoTitulo
        }
      >
        {titulo}
      </Text>

      <Text
        style={
          styles.infoValor
        }
      >
        {valor ||
          "Não informado"}
      </Text>
    </View>
  );
}

function Vazio({
  texto,
}: {
  texto: string;
}) {
  return (
    <View
      style={
        styles.vazio
      }
    >
      <Text
        style={
          styles.vazioText
        }
      >
        {texto}
      </Text>
    </View>
  );
}

// =====================================================
// ESTILOS
// =====================================================

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        FUNDO,
    },

    content: {
      flexGrow: 1,
      paddingBottom: 40,
    },

    hero: {
      minHeight: 350,

      backgroundColor:
        VINHO_ESCURO,

      justifyContent:
        "center",

      alignItems:
        "center",

      overflow:
        "hidden",

      padding: 20,
    },

    bolhaGrande: {
      position:
        "absolute",

      width: 450,
      height: 450,

      borderRadius:
        225,

      backgroundColor:
        "#A93758",

      top: -210,
      right: -130,
    },

    bolhaPequena: {
      position:
        "absolute",

      width: 280,
      height: 280,

      borderRadius:
        140,

      backgroundColor:
        "#D06480",

      bottom: -140,
      left: -80,
    },

    // LOGO NOVA

    logoImagemContainer: {
      width: 135,
      height: 135,

      marginBottom: 18,

      justifyContent:
        "center",

      alignItems:
        "center",

      shadowColor:
        "#000",

      shadowOpacity:
        0.3,

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

      alignSelf:
        "center",

      marginBottom: 22,

      shadowColor:
        "#000",

      shadowOpacity:
        0.2,

      shadowRadius: 15,

      shadowOffset: {
        width: 0,
        height: 7,
      },

      elevation: 6,
    },

    menuLogoImagem: {
      width: "100%",
      height: "100%",

      borderRadius: 25,
    },

    title: {
      color:
        BRANCO,

      fontSize: 37,

      fontWeight:
        "900",

      textAlign:
        "center",
    },

    subtitle: {
      color:
        "#E9CDD5",

      fontSize: 15,

      marginTop: 8,

      textAlign:
        "center",
    },

    main: {
      width: "100%",

      maxWidth: 760,

      alignSelf:
        "center",

      padding: 18,

      marginTop: -38,
    },

    card: {
      backgroundColor:
        BRANCO,

      borderRadius: 27,

      padding: 26,

      marginBottom: 18,

      shadowColor:
        "#000",

      shadowOpacity:
        0.09,

      shadowRadius: 20,

      elevation: 6,
    },

    cardGrande: {
      width: "100%",

      maxWidth: 550,

      backgroundColor:
        BRANCO,

      borderRadius: 30,

      padding: 32,

      shadowColor:
        "#000",

      shadowOpacity:
        0.1,

      shadowRadius: 25,

      elevation: 7,
    },

    tag: {
      color:
        VINHO_CLARO,

      fontSize: 11,

      fontWeight:
        "900",

      letterSpacing: 1.4,

      marginBottom: 7,
    },

    cardTitle: {
      color:
        VINHO_ESCURO,

      fontSize: 29,

      fontWeight:
        "900",

      marginBottom: 7,
    },

    descricao: {
      color:
        "#786E71",

      fontSize: 14,

      marginBottom: 20,
    },

    tabs: {
      flexDirection:
        "row",

      backgroundColor:
        "#F2E9EC",

      padding: 5,

      borderRadius: 15,

      marginBottom: 23,
    },

    tab: {
      flex: 1,

      paddingVertical: 13,

      alignItems:
        "center",

      borderRadius: 11,
    },

    tabAtiva: {
      backgroundColor:
        VINHO,
    },

    tabText: {
      color:
        VINHO,

      fontWeight:
        "800",
    },

    tabTextAtiva: {
      color:
        BRANCO,
    },

    label: {
      color:
        "#403639",

      fontWeight:
        "700",

      fontSize: 13,

      marginBottom: 7,
    },

    input: {
      height: 57,

      borderWidth: 1,

      borderColor:
        "#E3DADD",

      borderRadius: 15,

      paddingHorizontal: 15,

      backgroundColor:
        "#FAF8F9",

      marginBottom: 17,

      fontSize: 15,

      outlineStyle:
        "none" as any,
    },

    botaoPrincipal: {
      width: "100%",

      minHeight: 59,

      borderRadius: 17,

      backgroundColor:
        VINHO,

      justifyContent:
        "center",

      alignItems:
        "center",

      marginTop: 10,
    },

    botaoPrincipalTexto: {
      color:
        BRANCO,

      fontSize: 15,

      fontWeight:
        "900",
    },

    botaoSecundario: {
      width: "100%",

      minHeight: 59,

      borderRadius: 17,

      borderWidth: 2,

      borderColor:
        VINHO,

      justifyContent:
        "center",

      alignItems:
        "center",

      marginTop: 12,

      backgroundColor:
        BRANCO,
    },

    botaoSecundarioTexto: {
      color:
        VINHO,

      fontWeight:
        "900",
    },

    center: {
      flex: 1,

      backgroundColor:
        FUNDO,

      justifyContent:
        "center",

      alignItems:
        "center",

      padding: 20,
    },

    linkButton: {
      alignItems:
        "center",

      padding: 16,
    },

    linkText: {
      color:
        "#8E8286",

      fontWeight:
        "700",
    },

    centerText: {
      textAlign:
        "center",

      color:
        "#73696C",

      marginBottom: 15,
    },

    checkCircle: {
      width: 92,
      height: 92,

      borderRadius: 46,

      alignSelf:
        "center",

      justifyContent:
        "center",

      alignItems:
        "center",

      backgroundColor:
        "#E6F5EB",

      marginBottom: 20,
    },

    check: {
      color:
        VERDE,

      fontSize: 49,

      fontWeight:
        "900",
    },

    sucessoTitle: {
      color:
        VINHO_ESCURO,

      fontSize: 29,

      fontWeight:
        "900",

      textAlign:
        "center",

      marginBottom: 12,
    },

    idBox: {
      backgroundColor:
        "#FAF8F9",

      borderRadius: 14,

      padding: 14,

      marginBottom: 10,
    },

    idLabel: {
      color:
        "#91868A",

      fontSize: 11,

      textAlign:
        "center",
    },

    idText: {
      color:
        VINHO_ESCURO,

      fontWeight:
        "800",

      textAlign:
        "center",

      marginTop: 4,
    },

    page: {
      width: "100%",

      maxWidth: 920,

      alignSelf:
        "center",

      padding: 20,

      paddingTop: 35,

      paddingBottom: 60,
    },

    pageHeader: {
      flexDirection:
        "row",

      justifyContent:
        "space-between",

      marginBottom: 24,
    },

    pageTitle: {
      color:
        VINHO_ESCURO,

      fontSize: 31,

      fontWeight:
        "900",
    },

    pageSubtitulo: {
      color:
        "#786E71",

      marginTop: 5,
    },

    sairButton: {
      backgroundColor:
        "#F0E4E8",

      paddingHorizontal: 17,

      paddingVertical: 11,

      borderRadius: 13,
    },

    sairButtonText: {
      color:
        VINHO,

      fontWeight:
        "800",
    },

    alunoCard: {
      backgroundColor:
        BRANCO,

      padding: 22,

      borderRadius: 22,

      marginBottom: 16,
    },

    alunoNome: {
      color:
        VINHO_ESCURO,

      fontSize: 21,

      fontWeight:
        "900",

      marginBottom: 14,
    },

    info: {
      marginBottom: 9,
    },

    infoTitulo: {
      color:
        "#9A8F92",

      fontSize: 11,

      fontWeight:
        "700",
    },

    infoValor: {
      color:
        "#332B2D",

      fontSize: 14,

      fontWeight:
        "600",
    },

    vazio: {
      backgroundColor:
        BRANCO,

      padding: 35,

      borderRadius: 22,

      alignItems:
        "center",
    },

    vazioText: {
      color:
        "#7E7477",
    },

    adminPage: {
      width: "100%",

      maxWidth: 1200,

      alignSelf:
        "center",

      padding: 20,

      paddingTop: 35,

      paddingBottom: 70,
    },

    adminTop: {
      flexDirection:
        "row",

      justifyContent:
        "space-between",

      marginBottom: 22,
    },

    adminTitle: {
      color:
        VINHO_ESCURO,

      fontSize: 33,

      fontWeight:
        "900",
    },

    adminSub: {
      color:
        "#807477",

      marginTop: 3,
    },

    adminTabs: {
      flexDirection:
        "row",

      backgroundColor:
        BRANCO,

      borderRadius: 18,

      padding: 6,

      marginBottom: 22,
    },

    adminTab: {
      flex: 1,

      paddingVertical: 15,

      alignItems:
        "center",

      borderRadius: 13,
    },

    adminTabAtiva: {
      backgroundColor:
        VINHO,
    },

    adminTabTexto: {
      color:
        VINHO,

      fontWeight:
        "800",
    },

    adminTabTextoAtivo: {
      color:
        BRANCO,
    },

    resumo: {
      backgroundColor:
        VINHO,

      padding: 28,

      borderRadius: 25,

      marginBottom: 20,
    },

    resumoNumero: {
      color:
        BRANCO,

      fontSize: 42,

      fontWeight:
        "900",
    },

    resumoTexto: {
      color:
        "#F5DDE4",
    },

    pagamentoExplicacao: {
      color:
        "#746A6D",

      textAlign:
        "center",

      marginBottom: 20,
    },

    pagamentoCard: {
      borderRadius: 22,

      padding: 22,

      marginBottom: 16,

      borderWidth: 2,
    },

    pagamentoVerde: {
      borderColor:
        "#A6D9B4",

      backgroundColor:
        "#F0FAF3",
    },

    pagamentoVermelho: {
      borderColor:
        "#ECB1B9",

      backgroundColor:
        "#FFF2F4",
    },

    pagamentoNome: {
      color:
        VINHO_ESCURO,

      fontSize: 21,

      fontWeight:
        "900",
    },

    pagamentoEscola: {
      color:
        "#827679",

      marginTop: 4,
    },

    switchArea: {
      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "center",

      gap: 12,

      marginVertical: 22,
    },

    statusNaoPago: {
      color:
        VERMELHO,

      fontWeight:
        "900",
    },

    statusPago: {
      color:
        VERDE,

      fontWeight:
        "900",
    },

    statusDesativado: {
      color:
        "#A69B9E",

      fontWeight:
        "700",
    },

    seletorMes: {
      flexDirection:
        "row",

      justifyContent:
        "space-between",

      alignItems:
        "center",

      backgroundColor:
        BRANCO,

      padding: 13,

      borderRadius: 18,

      marginBottom: 16,
    },

    mesButton: {
      width: 47,

      height: 47,

      borderRadius: 14,

      backgroundColor:
        "#F1E6E9",

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    mesButtonText: {
      color:
        VINHO,

      fontSize: 28,

      fontWeight:
        "900",
    },

    mesTitulo: {
      color:
        VINHO_ESCURO,

      fontSize: 19,

      fontWeight:
        "900",
    },

    calendario: {
      backgroundColor:
        BRANCO,

      borderRadius: 22,

      padding: 20,
    },

    calendarioTitulo: {
      color:
        VINHO_ESCURO,

      fontSize: 22,

      fontWeight:
        "900",

      marginBottom: 20,
    },

    diasSemana: {
      flexDirection:
        "row",
    },

    diaSemana: {
      width:
        "14.2857%",

      textAlign:
        "center",

      color:
        "#91868A",

      fontWeight:
        "800",
    },

    grade: {
      flexDirection:
        "row",

      flexWrap:
        "wrap",
    },

    dia: {
      width:
        "14.2857%",

      minHeight: 68,

      borderWidth: 0.5,

      borderColor:
        "#EEE7E9",

      alignItems:
        "center",

      padding: 6,
    },

    numeroDia: {
      color:
        "#3E3538",

      fontWeight:
        "700",
    },
  });
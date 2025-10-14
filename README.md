
# 💰 FinanceApp — Controle de Finanças Pessoais

Um aplicativo mobile desenvolvido com **React Native** e **Expo** para ajudar você a **controlar receitas, despesas e acompanhar seu saldo** de forma prática e segura.

---

## 🎯 Objetivo

Permitir que o usuário **registre suas movimentações financeiras**, visualize um **dashboard com resumo financeiro** e mantenha **login seguro** por meio da integração com o **Supabase**.

---

## ⚙️ Tecnologias Utilizadas

- [Expo](https://docs.expo.dev/) — ambiente de desenvolvimento
- [React Native](https://reactnative.dev/) — framework principal
- [Supabase](https://supabase.com/) — autenticação e banco de dados
- [Victory Native](https://nearform.com/open-source/victory-native/) — gráficos de receitas e despesas

---

## 📱 Funcionalidades Principais

✅ **Login e Cadastro de Usuário**  
Autenticação segura integrada ao Supabase.

✅ **Dashboard Financeiro**  
- Exibição do **saldo atual** (receitas - despesas).  
- **Gráfico interativo** com receitas e despesas mensais.  
- Destaques como **maior despesa** e **categoria mais usada**.

✅ **Cadastro de Despesas**  
- Valor, categoria, data, descrição e upload de comprovante.

✅ **Cadastro de Receitas**  
- Valor, fonte, data e descrição.

✅ **Gestão de Categorias**  
- Criação e edição de categorias personalizadas.

✅ **Listagem e Filtros**  
- Visualização de lançamentos por tipo, data ou categoria.

✅ **Design Responsivo**  
- Interface adaptável e de fácil usabilidade em diferentes tamanhos de tela.

---

## 🚀 Como Executar o Projeto

1. **Instale o Expo CLI**
   ```bash
   npm install -g expo-cli
Instale as dependências

npm install
Configure o Supabase

Crie um projeto no Supabase

Copie a URL e a chave anônima e adicione em um arquivo .env:

EXPO_PUBLIC_SUPABASE_URL=https://sua-url.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sua-chave
Inicie o projeto

npx expo start

🧠 Boas Práticas Aplicadas

Componentes funcionais com React Hooks
Orientação a objetos na organização do código
Estrutura modular por funcionalidade
Integração direta com Supabase (Auth + Database)
Código limpo e bem documentado

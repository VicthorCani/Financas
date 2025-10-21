# 💰 Finanças Pessoais

Aplicativo mobile desenvolvido com **React Native** e **Expo**, voltado para o **controle de finanças pessoais**.  
Permite ao usuário registrar **receitas, despesas, categorias** e visualizar **transações**, além de oferecer autenticação segura com **contexto de login e registro**.

---

## 📱 Funcionalidades

- 🔐 **Autenticação**: Login e cadastro de usuários com contexto global.
- 🏠 **Dashboard**: Visão geral das finanças pessoais.
- 💸 **Despesas**: Registro e listagem de gastos.
- 💰 **Receitas**: Registro de ganhos e entradas.
- 🧾 **Transações**: Histórico completo de movimentações.
- 🗂️ **Categorias**: Organização das finanças por tipo de gasto/receita.

---

## 🛠️ Tecnologias Utilizadas

- [Expo](https://expo.dev/)
- [React Native](https://reactnative.dev/)
- [React Navigation](https://reactnavigation.org/)
- Context API (para gerenciamento de autenticação)
- JavaScript (ES6+)

---

## 📂 Estrutura do Projeto

financas-pessoais/
├── App.js # Ponto principal com navegação entre telas
├── index.js # Registro da aplicação no Expo
├── app.json # Configurações do projeto Expo
├── .gitignore
└── src/
├── contexts/
│ └── AuthContext.js # Contexto de autenticação
├── screens/
│ ├── LoginScreen.js # Tela de login
│ ├── RegisterScreen.js # Tela de registro
│ ├── DashboardScreen.js # Tela inicial com resumo
│ ├── ExpensesScreen.js # Tela de despesas
│ ├── IncomesScreen.js # Tela de receitas
│ ├── CategoriesScreen.js # Tela de categorias
│ └── TransactionsScreen.js # Tela de transações
└── assets/
├── icon.png
├── splash-icon.png
├── adaptive-icon.png
└── favicon.png

---

## ⚙️ Como Executar o Projeto

### 🔧 Pré-requisitos
- Node.js instalado
- Expo CLI instalado (`npm install -g expo-cli`)

### ▶️ Rodando o projeto
```bash
# Instalar dependências
npm install

# Iniciar o servidor Expo
npx expo start
Abra o aplicativo Expo Go no celular e escaneie o QR Code para executar o app.

📲 Navegação do Aplicativo
A navegação principal é gerenciada pelo React Navigation Stack, conforme definido em App.js:

Login → LoginScreen

Register → RegisterScreen

Dashboard → DashboardScreen

Expenses → ExpensesScreen

Incomes → IncomesScreen

Categories → CategoriesScreen

Transactions → TransactionsScreen

👨‍💻 Autor

Victhor Vilson Klipp Cani

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


<img width="351" height="614" alt="image" src="https://github.com/user-attachments/assets/a51cf74b-5b2d-4e99-a1a0-6c45b484009d" />
<img width="355" height="512" alt="image" src="https://github.com/user-attachments/assets/afbbd148-417a-4f33-bfec-3789ec7b837b" />
<img width="358" height="518" alt="image" src="https://github.com/user-attachments/assets/81fe7297-cc92-4643-bc5e-849b424b3a2a" />
<img width="465" height="730" alt="image" src="https://github.com/user-attachments/assets/2d35c2e0-935a-49c9-9cbb-ff7123960472" />
<img width="420" height="555" alt="image" src="https://github.com/user-attachments/assets/13c37e57-587c-4b64-83e7-71b27b31db17" />
<img width="401" height="505" alt="image" src="https://github.com/user-attachments/assets/a73afe21-eef2-400b-be0c-89af4f091e2b" />
<img width="451" height="675" alt="image" src="https://github.com/user-attachments/assets/4eff944e-b410-4a53-b1f8-a74e879b2f4d" />
<img width="429" height="668" alt="image" src="https://github.com/user-attachments/assets/72af45f4-f020-4910-b345-5e9c90fe407b" />
<img width="423" height="679" alt="image" src="https://github.com/user-attachments/assets/b93a0d41-0c51-46b5-8eb9-f4be69d006c6" />








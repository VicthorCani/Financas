// src/screens/DashboardScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Animated,
} from 'react-native';
import { VictoryBar, VictoryChart, VictoryAxis, VictoryTheme, VictoryTooltip } from 'victory-native';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../config/supabase';

export default function DashboardScreen({ navigation }) {
  const [balance, setBalance] = useState(0);
  const [chartData, setChartData] = useState([]);
  const [highlights, setHighlights] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const { user, signOut } = useAuth();

  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];

  const loadDashboardData = async () => {
    try {
      if (!user?.id) return;

      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) throw error;

      const incomes = transactions.filter(t => t.type === 'income');
      const expenses = transactions.filter(t => t.type === 'expense');

      const totalIncome = incomes.reduce((s, t) => s + t.amount, 0);
      const totalExpenses = expenses.reduce((s, t) => s + t.amount, 0);

      setBalance(totalIncome - totalExpenses);

      setChartData(processMonthlyData(transactions));
      setHighlights(calculateHighlights(transactions));

      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]).start();

    } catch (e) {
      Alert.alert("Erro", "Não foi possível carregar o dashboard.");
      console.log(e);
    }
  };

  const processMonthlyData = (transactions) => {
    const months = {};
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

    transactions.forEach(t => {
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      const label = `${monthNames[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`;

      if (!months[key]) months[key] = { month: label, income: 0, expenses: 0, net: 0 };

      if (t.type === "income") months[key].income += t.amount;
      else months[key].expenses += t.amount;

      months[key].net = months[key].income - months[key].expenses;
    });

    return Object.keys(months).map(k => months[k]).slice(0, 6).reverse();
  };

  const calculateHighlights = (transactions) => {
    if (!transactions.length) {
      return {
        highestExpense: null,
        highestIncome: null,
        mostUsedCategory: "Nenhuma",
        totalTransactions: 0
      };
    }

    const exp = transactions.filter(t => t.type === "expense");
    const inc = transactions.filter(t => t.type === "income");

    const highestExpense = exp.length
      ? exp.reduce((max, t) => (t.amount > max.amount ? t : max))
      : null;

    const highestIncome = inc.length
      ? inc.reduce((max, t) => (t.amount > max.amount ? t : max))
      : null;

    const categoryCount = {};
    transactions.forEach(t => {
      categoryCount[t.category] = (categoryCount[t.category] || 0) + 1;
    });

    const mostUsedCategory = Object.keys(categoryCount).length
      ? Object.keys(categoryCount).reduce((a, b) => categoryCount[a] > categoryCount[b] ? a : b)
      : "Nenhuma";

    return {
      highestExpense,
      highestIncome,
      mostUsedCategory,
      totalTransactions: transactions.length,
    };
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigation.navigate("Login");
  };

  const MenuCard = ({ icon, title, onPress }) => (
    <TouchableOpacity onPress={onPress} style={styles.menuCard}>
      <View style={styles.menuGradient}>
        <Text style={styles.menuIcon}>{icon}</Text>
        <Text style={styles.menuTitle}>{title}</Text>
      </View>
    </TouchableOpacity>
  );

  const HighlightCard = ({ icon, label, value, description }) => (
    <View style={styles.highlightCard}>
      <View style={styles.highlightIcon}>
        <Text style={styles.highlightEmoji}>{icon}</Text>
      </View>
      <Text style={styles.highlightLabel}>{label}</Text>
      <Text style={styles.highlightValue}>{value}</Text>
      {description && <Text style={styles.highlightDescription}>{description}</Text>}
    </View>
  );

  return (
    <View style={styles.container}>

      {/* HEADER */}
      <View style={styles.headerGradient}>
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>Bem-vindo</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
          </View>

          <TouchableOpacity onPress={handleSignOut} style={styles.signOutButton}>
            <Text style={styles.signOutText}>⟳</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* SCROLL */}
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >

        {/* SALDO */}
        <Animated.View style={[
          styles.balanceCard,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
        ]}>
          <View style={[
            styles.balanceContainer,
            { backgroundColor: balance >= 0 ? "#34C759" : "#FF3B30" }
          ]}>
            <Text style={styles.balanceLabel}>Saldo Total</Text>

            <Text style={styles.balanceValue}>
              R$ {Math.abs(balance).toFixed(2)}
            </Text>

            <Text style={styles.balanceStatus}>
              {balance >= 0 ? "✓ Positivo" : "⚠ Negativo"}
            </Text>
          </View>
        </Animated.View>

        {/* GRÁFICO */}
        <View style={styles.chartCard}>
          <Text style={styles.cardTitle}>📊 Análise Mensal</Text>

          {chartData.length ? (
            <VictoryChart
              theme={VictoryTheme.material}
              domainPadding={15}
              height={250}
              padding={{ top: 20, bottom: 50, left: 50, right: 20 }}
            >
              <VictoryAxis />
              <VictoryAxis dependentAxis />

              <VictoryBar
                data={chartData}
                x="month"
                y="income"
                style={{ data: { fill: "#34C759" } }}
                labels={({ datum }) => `R$ ${datum.income.toFixed(0)}`}
                labelComponent={<VictoryTooltip />}
              />

              <VictoryBar
                data={chartData}
                x="month"
                y="expenses"
                style={{ data: { fill: "#FF3B30" } }}
                labels={({ datum }) => `R$ ${datum.expenses.toFixed(0)}`}
                labelComponent={<VictoryTooltip />}
              />
            </VictoryChart>
          ) : (
            <Text style={{ textAlign: "center", color: "#666" }}>
              Nenhum dado disponível
            </Text>
          )}
        </View>

        {/* DESTAQUES */}
        <View style={styles.highlightsGrid}>
          <Text style={styles.sectionTitle}>🎯 Destaques</Text>

          <View style={styles.highlightsRow}>
            <HighlightCard
              icon="💸"
              label="Maior Despesa"
              value={highlights?.highestExpense ? `R$ ${highlights.highestExpense.amount.toFixed(2)}` : "Nenhuma"}
              description={highlights?.highestExpense?.description}
            />
            <HighlightCard
              icon="💰"
              label="Maior Receita"
              value={highlights?.highestIncome ? `R$ ${highlights.highestIncome.amount.toFixed(2)}` : "Nenhuma"}
              description={highlights?.highestIncome?.description}
            />
          </View>

          <View style={styles.highlightsRow}>
            <HighlightCard
              icon="📂"
              label="Categoria Top"
              value={highlights?.mostUsedCategory || "Nenhuma"}
            />
            <HighlightCard
              icon="📊"
              label="Total Transações"
              value={highlights?.totalTransactions || 0}
            />
          </View>
        </View>

        {/* MENU */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>🚀 Navegação Rápida</Text>

          <View style={styles.menuGrid}>
            <MenuCard icon="💳" title="Despesas" onPress={() => navigation.navigate("Expenses")} />
            <MenuCard icon="💰" title="Receitas" onPress={() => navigation.navigate("Incomes")} />
            <MenuCard icon="📊" title="Relatórios" onPress={() => navigation.navigate("Reports")} />
            <MenuCard icon="⚙️" title="Configurações" onPress={() => navigation.navigate("Settings")} />
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },

  headerGradient: {
    backgroundColor: "#667eea",
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 25,
  },

  welcomeText: { fontSize: 18, color: "white", fontWeight: "300" },
  userEmail: { color: "rgba(255,255,255,0.8)", marginTop: 4 },

  signOutButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: 10,
    borderRadius: 12,
  },
  signOutText: { fontSize: 18, color: "white", fontWeight: "bold" },

  scrollView: { marginTop: -20 },

  balanceCard: { margin: 20, borderRadius: 25 },

  balanceContainer: {
    padding: 25,
    borderRadius: 25,
  },

  balanceLabel: { color: "white", opacity: 0.9 },
  balanceValue: { fontSize: 36, color: "white", fontWeight: "bold" },
  balanceStatus: { color: "white", opacity: 0.9 },

  chartCard: {
    backgroundColor: "white",
    margin: 20,
    padding: 20,
    borderRadius: 25,
  },

  cardTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },

  highlightsGrid: { margin: 20 },
  sectionTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 15 },

  highlightsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },

  highlightCard: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 20,
    width: "48%",
  },

  highlightIcon: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: "#eee",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },

  highlightEmoji: { fontSize: 20 },
  highlightLabel: { fontSize: 12, color: "#666", marginBottom: 8 },
  highlightValue: { fontSize: 16, fontWeight: "bold" },
  highlightDescription: { fontSize: 10, color: "#777" },

  menuSection: { margin: 20 },
  menuGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },

  menuCard: {
    width: "48%",
    marginBottom: 15,
    borderRadius: 20,
    backgroundColor: "#667eea",
  },

  menuGradient: { padding: 25, borderRadius: 20, alignItems: "center" },
  menuIcon: { fontSize: 24, color: "white" },
  menuTitle: { fontSize: 14, color: "white", marginTop: 8 },
});

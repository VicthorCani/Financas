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
  Dimensions,
} from 'react-native';
import { VictoryBar, VictoryChart, VictoryAxis, VictoryTheme, VictoryTooltip } from 'victory-native';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../config/supabase';

const { width } = Dimensions.get('window');

export default function DashboardScreen({ navigation }) {
  const [balance, setBalance] = useState(0);
  const [chartData, setChartData] = useState([]);
  const [highlights, setHighlights] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const { user, signOut } = useAuth();
  
  // Animações
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];

  const loadDashboardData = async () => {
    try {
      // Carregar transações do usuário
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) throw error;

      // Calcular saldo
      const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const totalExpenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      const newBalance = totalIncome - totalExpenses;
      setBalance(newBalance);

      // Preparar dados para o gráfico
      const monthlyData = processMonthlyData(transactions);
      setChartData(monthlyData);

      // Calcular destaques
      const highlightsData = calculateHighlights(transactions);
      setHighlights(highlightsData);

      // Trigger animations
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();

    } catch (error) {
      Alert.alert('Erro', 'Erro ao carregar dados do dashboard');
      console.error(error);
    }
  };

  const processMonthlyData = (transactions) => {
    const months = {};
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    
    transactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
      const monthLabel = `${monthNames[date.getMonth()]}/${date.getFullYear().toString().slice(2)}`;
      
      if (!months[monthKey]) {
        months[monthKey] = { 
          month: monthLabel,
          income: 0, 
          expenses: 0,
          net: 0
        };
      }
      
      if (transaction.type === 'income') {
        months[monthKey].income += transaction.amount;
      } else {
        months[monthKey].expenses += transaction.amount;
      }
      
      months[monthKey].net = months[monthKey].income - months[monthKey].expenses;
    });

    return Object.keys(months).map(key => months[key]).slice(0, 6).reverse();
  };

  const calculateHighlights = (transactions) => {
    const expenses = transactions.filter(t => t.type === 'expense');
    const incomes = transactions.filter(t => t.type === 'income');
    
    const highestExpense = expenses.length > 0 
      ? expenses.reduce((max, t) => t.amount > max.amount ? t : max, expenses[0])
      : null;

    const highestIncome = incomes.length > 0
      ? incomes.reduce((max, t) => t.amount > max.amount ? t : max, incomes[0])
      : null;

    // Calcular categoria mais usada
    const categoryCount = {};
    transactions.forEach(t => {
      categoryCount[t.category] = (categoryCount[t.category] || 0) + 1;
    });

    const mostUsedCategory = Object.keys(categoryCount).length > 0
      ? Object.keys(categoryCount).reduce((a, b) => categoryCount[a] > categoryCount[b] ? a : b)
      : 'Nenhuma';

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
    navigation.navigate('Login');
  };

  const MenuCard = ({ icon, title, onPress, colors }) => (
    <TouchableOpacity onPress={onPress} style={styles.menuCard}>
      <View style={[styles.menuGradient, { backgroundColor: colors[0] }]}>
        <Text style={styles.menuIcon}>{icon}</Text>
        <Text style={styles.menuTitle}>{title}</Text>
      </View>
    </TouchableOpacity>
  );

  const HighlightCard = ({ icon, label, value, description, colors }) => (
    <View style={styles.highlightCard}>
      <View style={[styles.highlightIcon, { backgroundColor: colors.background }]}>
        <Text style={[styles.highlightEmoji, { color: colors.color }]}>{icon}</Text>
      </View>
      <Text style={styles.highlightLabel}>{label}</Text>
      <Text style={styles.highlightValue} numberOfLines={1}>
        {value}
      </Text>
      {description && (
        <Text style={styles.highlightDescription} numberOfLines={1}>
          {description}
        </Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header com Gradiente Simulado */}
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

      <ScrollView
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor="#fff"
            colors={['#fff']}
          />
        }
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Saldo Atual */}
        <Animated.View 
          style={[
            styles.balanceCard,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={[
            styles.balanceContainer,
            { backgroundColor: balance >= 0 ? '#34C759' : '#FF3B30' }
          ]}>
            <Text style={styles.balanceLabel}>Saldo Total</Text>
            <Text style={styles.balanceValue}>
              R$ {Math.abs(balance).toFixed(2)}
            </Text>
            <Text style={styles.balanceStatus}>
              {balance >= 0 ? '✓ Positivo' : '⚠ Negativo'}
            </Text>
            <View style={styles.balanceWave} />
          </View>
        </Animated.View>

        {/* Gráfico Moderno */}
        <View style={styles.chartCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>📊 Análise Mensal</Text>
            <Text style={styles.cardSubtitle}>Últimos 6 meses</Text>
          </View>
          
          {chartData.length > 0 ? (
            <VictoryChart
              theme={VictoryTheme.material}
              domainPadding={15}
              height={250}
              padding={{ top: 20, bottom: 50, left: 50, right: 20 }}
            >
              <VictoryAxis
                style={{
                  axis: { stroke: "#e0e0e0" },
                  tickLabels: { fill: "#666", fontSize: 10 }
                }}
              />
              <VictoryAxis
                dependentAxis
                style={{
                  axis: { stroke: "#e0e0e0" },
                  tickLabels: { fill: "#666", fontSize: 10 }
                }}
              />
              <VictoryBar
                data={chartData}
                x="month"
                y="income"
                style={{ 
                  data: { 
                    fill: "#34C759",
                    width: 12,
                  } 
                }}
                cornerRadius={{ top: 6 }}
                labels={({ datum }) => `R$ ${datum.income.toFixed(0)}`}
                labelComponent={<VictoryTooltip 
                  flyoutStyle={{ fill: "white", stroke: "#34C759" }}
                  style={{ fontSize: 10 }}
                />}
              />
              <VictoryBar
                data={chartData}
                x="month"
                y="expenses"
                style={{ 
                  data: { 
                    fill: "#FF3B30",
                    width: 12,
                  } 
                }}
                cornerRadius={{ top: 6 }}
                labels={({ datum }) => `R$ ${datum.expenses.toFixed(0)}`}
                labelComponent={<VictoryTooltip 
                  flyoutStyle={{ fill: "white", stroke: "#FF3B30" }}
                  style={{ fontSize: 10 }}
                />}
              />
            </VictoryChart>
          ) : (
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataEmoji}>📈</Text>
              <Text style={styles.noDataText}>Nenhum dado disponível</Text>
              <Text style={styles.noDataSubtext}>Adicione transações para ver gráficos</Text>
            </View>
          )}
        </View>

        {/* Destaques em Grid */}
        <View style={styles.highlightsGrid}>
          <Text style={styles.sectionTitle}>🎯 Destaques</Text>
          <View style={styles.highlightsRow}>
            <HighlightCard 
              icon="💸"
              label="Maior Despesa"
              value={highlights.highestExpense ? `R$ ${highlights.highestExpense.amount.toFixed(2)}` : 'Nenhuma'}
              description={highlights.highestExpense?.description}
              colors={{ background: '#ffebee', color: '#e53935' }}
            />
            <HighlightCard 
              icon="💰"
              label="Maior Receita"
              value={highlights.highestIncome ? `R$ ${highlights.highestIncome.amount.toFixed(2)}` : 'Nenhuma'}
              description={highlights.highestIncome?.description}
              colors={{ background: '#e8f5e8', color: '#43a047' }}
            />
          </View>

          <View style={styles.highlightsRow}>
            <HighlightCard 
              icon="📂"
              label="Categoria Top"
              value={highlights.mostUsedCategory}
              colors={{ background: '#f3e5f5', color: '#8e24aa' }}
            />
            <HighlightCard 
              icon="📊"
              label="Total Transações"
              value={highlights.totalTransactions || '0'}
              colors={{ background: '#e3f2fd', color: '#1976d2' }}
            />
          </View>
        </View>

        {/* Menu de Navegação Moderno */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>🚀 Navegação Rápida</Text>
          <View style={styles.menuGrid}>
            <MenuCard 
              icon="💳" 
              title="Despesas" 
              onPress={() => navigation.navigate('Expenses')}
              colors={['#FF6B6B', '#EE5A52']}
            />
            <MenuCard 
              icon="💰" 
              title="Receitas" 
              onPress={() => navigation.navigate('Incomes')}
              colors={['#51CF66', '#40C057']}
            />
            <MenuCard 
              icon="📊" 
              title="Relatórios" 
              onPress={() => navigation.navigate('Reports')}
              colors={['#339AF0', '#228BE6']}
            />
            <MenuCard 
              icon="⚙️" 
              title="Configurações" 
              onPress={() => navigation.navigate('Settings')}
              colors={['#CC5DE8', '#BE4BDB']}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  headerGradient: {
    backgroundColor: '#667eea',
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 25,
  },
  welcomeText: {
    fontSize: 18,
    color: 'white',
    fontWeight: '300',
  },
  userEmail: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  signOutButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 10,
    borderRadius: 12,
  },
  signOutText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
    marginTop: -20,
  },
  balanceCard: {
    margin: 20,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  balanceContainer: {
    padding: 25,
    borderRadius: 25,
    overflow: 'hidden',
  },
  balanceLabel: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
    marginBottom: 8,
  },
  balanceValue: {
    fontSize: 36,
    color: 'white',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  balanceStatus: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  balanceWave: {
    position: 'absolute',
    bottom: -30,
    right: -30,
    width: 100,
    height: 100,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 50,
  },
  chartCard: {
    backgroundColor: 'white',
    margin: 20,
    padding: 20,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  noDataContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noDataEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  noDataText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
    marginBottom: 8,
  },
  noDataSubtext: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  highlightsGrid: {
    margin: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  highlightsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  highlightCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 20,
    width: '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  highlightIcon: {
    width: 50,
    height: 50,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  highlightEmoji: {
    fontSize: 20,
  },
  highlightLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
  },
  highlightValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  highlightDescription: {
    fontSize: 10,
    color: '#999',
  },
  menuSection: {
    margin: 20,
    marginBottom: 40,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  menuCard: {
    width: '48%',
    marginBottom: 15,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 5,
  },
  menuGradient: {
    padding: 25,
    borderRadius: 20,
    alignItems: 'center',
    minHeight: 100,
    justifyContent: 'center',
  },
  menuIcon: {
    fontSize: 24,
    marginBottom: 8,
    color: 'white',
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
});
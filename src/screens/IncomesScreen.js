// src/screens/IncomesScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../config/supabase';

const { width } = Dimensions.get('window');

export default function IncomesScreen({ navigation }) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [source, setSource] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // Animações
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(30))[0];

  // Fontes padrão como fallback
  const defaultSources = [
    '💰 Salário', '💼 Freelance', '📈 Investimentos', '🎁 Presente',
    '🏆 Bônus', '🔄 Reembolso', '🏢 Aluguel', '📊 Dividendos'
  ];

  useEffect(() => {
    loadCategories();
    // Trigger animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'income');

      if (error) {
        console.log('Erro ao carregar categorias, usando padrão:', error);
        setCategories(defaultSources.map(name => ({ id: name, name })));
      } else {
        // Se não há categorias, usa as padrão
        if (data.length === 0) {
          setCategories(defaultSources.map(name => ({ id: name, name })));
        } else {
          setCategories(data);
        }
      }
    } catch (error) {
      console.log('Erro crítico, usando fontes padrão:', error);
      setCategories(defaultSources.map(name => ({ id: name, name })));
    }
  };

  const handleSubmit = async () => {
    if (!amount || !description || !source) {
      Alert.alert('❌ Erro', 'Por favor, preencha valor, descrição e fonte');
      return;
    }

    // Validação do valor
    const amountValue = parseFloat(amount.replace(',', '.'));
    if (isNaN(amountValue) || amountValue <= 0) {
      Alert.alert('❌ Erro', 'Por favor, insira um valor válido maior que zero');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          type: 'income',
          amount: amountValue,
          description,
          category: source.replace(/^[^\w]+\s/, ''), // Remove emoji para salvar
          date: date.toISOString().split('T')[0],
        });

      if (error) throw error;

      Alert.alert('✅ Sucesso', 'Receita cadastrada com sucesso!');
      navigation.goBack();
      
    } catch (error) {
      Alert.alert('❌ Erro', 'Não foi possível cadastrar a receita');
      console.error(error);
    }
    setLoading(false);
  };

  // Função para formatar o valor
  const handleAmountChange = (text) => {
    const cleanedText = text.replace(/[^0-9,.]/g, '');
    const formattedText = cleanedText.replace(',', '.');
    
    if (formattedText === '' || !isNaN(formattedText)) {
      setAmount(cleanedText);
    }
  };

  const SourceCard = ({ source: src, isSelected, onPress }) => (
    <TouchableOpacity
      style={[
        styles.sourceCard,
        isSelected && styles.sourceCardSelected,
      ]}
      onPress={onPress}
    >
      <Text style={[
        styles.sourceEmoji,
        isSelected && styles.sourceEmojiSelected,
      ]}>
        {src.name.split(' ')[0]}
      </Text>
      <Text style={[
        styles.sourceName,
        isSelected && styles.sourceNameSelected,
      ]}>
        {src.name.split(' ').slice(1).join(' ')}
      </Text>
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header Gradient */}
      <View style={styles.headerGradient}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Nova Receita</Text>
          <View style={styles.headerPlaceholder} />
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View 
          style={[
            styles.formContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          {/* Card Principal do Formulário */}
          <View style={styles.formCard}>
            {/* Campo Valor */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>💵 Valor da Receita</Text>
              <View style={styles.amountContainer}>
                <Text style={styles.currencySymbol}>R$</Text>
                <TextInput
                  style={styles.amountInput}
                  placeholder="0,00"
                  value={amount}
                  onChangeText={handleAmountChange}
                  keyboardType="decimal-pad"
                  placeholderTextColor="#999"
                />
              </View>
            </View>

            {/* Campo Descrição */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>📝 Descrição</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Ex: Pagamento projeto cliente X"
                value={description}
                onChangeText={setDescription}
                placeholderTextColor="#999"
              />
            </View>

            {/* Campo Data */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>📅 Data</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.dateButtonIcon}>📅</Text>
                <Text style={styles.dateButtonText}>
                  {date.toLocaleDateString('pt-BR')}
                </Text>
              </TouchableOpacity>
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate) setDate(selectedDate);
                }}
              />
            )}

            {/* Seção de Fontes */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📊 Fonte da Receita</Text>
              <Text style={styles.sectionSubtitle}>
                Selecione a fonte ou digite uma nova
              </Text>
              
              {/* Input para fonte personalizada */}
              <TextInput
                style={styles.textInput}
                placeholder="Ou digite uma fonte personalizada..."
                value={source}
                onChangeText={setSource}
                placeholderTextColor="#999"
              />
              
              <View style={styles.sourcesGrid}>
                {categories.map((cat) => (
                  <SourceCard
                    key={cat.id || cat.name}
                    source={cat}
                    isSelected={source === cat.name}
                    onPress={() => setSource(cat.name)}
                  />
                ))}
              </View>

              {/* Fonte Selecionada */}
              {source && (
                <View style={styles.selectedSourceBadge}>
                  <Text style={styles.selectedSourceText}>
                    ✅ Selecionada: <Text style={styles.selectedSourceName}>
                      {source.replace(/^[^\w]+\s/, '')}
                    </Text>
                  </Text>
                </View>
              )}
            </View>

            {/* Botão de Submit */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                loading && styles.submitButtonDisabled,
                (!amount || !description || !source) && styles.submitButtonInactive
              ]}
              onPress={handleSubmit}
              disabled={loading || !amount || !description || !source}
            >
              <Text style={styles.submitButtonIcon}>💰</Text>
              <Text style={styles.submitButtonText}>
                {loading ? 'Cadastrando...' : 'Cadastrar Receita'}
              </Text>
            </TouchableOpacity>

            {/* Dica Rápida */}
            <View style={styles.tipContainer}>
              <Text style={styles.tipIcon}>💡</Text>
              <Text style={styles.tipText}>
                Mantenha suas receitas organizadas por fonte para melhor controle financeiro
              </Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  headerGradient: {
    backgroundColor: '#34C759',
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 25,
  },
  backButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 10,
    borderRadius: 12,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  headerPlaceholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
    marginTop: -20,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  formContainer: {
    padding: 20,
  },
  formCard: {
    backgroundColor: 'white',
    borderRadius: 25,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 5,
  },
  inputGroup: {
    marginBottom: 25,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 15,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: '#e9ecef',
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#495057',
    marginRight: 10,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#34C759',
    paddingVertical: 15,
  },
  textInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 15,
    padding: 20,
    fontSize: 16,
    borderWidth: 2,
    borderColor: '#e9ecef',
    color: '#333',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 15,
    padding: 20,
    borderWidth: 2,
    borderColor: '#e9ecef',
  },
  dateButtonIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  sourcesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  sourceCard: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  sourceCardSelected: {
    backgroundColor: '#34C759',
    borderColor: '#34C759',
    transform: [{ scale: 1.05 }],
  },
  sourceEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  sourceEmojiSelected: {
    color: 'white',
  },
  sourceName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#495057',
    textAlign: 'center',
  },
  sourceNameSelected: {
    color: 'white',
  },
  selectedSourceBadge: {
    backgroundColor: '#e8f5e8',
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
    marginTop: 15,
  },
  selectedSourceText: {
    fontSize: 14,
    color: '#2e7d32',
  },
  selectedSourceName: {
    fontWeight: 'bold',
  },
  submitButton: {
    backgroundColor: '#34C759',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderRadius: 15,
    marginTop: 10,
    shadowColor: '#34C759',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
    shadowColor: '#ccc',
  },
  submitButtonInactive: {
    backgroundColor: '#dee2e6',
    shadowColor: '#dee2e6',
  },
  submitButtonIcon: {
    fontSize: 18,
    marginRight: 10,
    color: 'white',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    padding: 15,
    borderRadius: 15,
    marginTop: 20,
  },
  tipIcon: {
    fontSize: 20,
    marginRight: 10,
    color: '#1976d2',
  },
  tipText: {
    flex: 1,
    fontSize: 12,
    color: '#1976d2',
    fontStyle: 'italic',
  },
});
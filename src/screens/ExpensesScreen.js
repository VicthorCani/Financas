import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Image,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../config/supabase';

const { width } = Dimensions.get('window');

export default function ExpensesScreen({ navigation }) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // Animações
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(30))[0];

  // CATEGORIAS PADRÃO COMO FALLBACK
  const defaultCategories = [
    '🍔 Alimentação', '🚗 Transporte', '🏠 Moradia', '🏥 Saúde', 
    '🎓 Educação', '🎮 Lazer', '🛍️ Compras', '📦 Outros'
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
        .eq('type', 'expense');

      if (error) {
        console.log('Erro ao carregar categorias, usando padrão:', error);
        setCategories(defaultCategories.map(name => ({ id: name, name })));
      } else {
        // Se não há categorias, usa as padrão
        if (data.length === 0) {
          setCategories(defaultCategories.map(name => ({ id: name, name })));
        } else {
          setCategories(data);
        }
      }
    } catch (error) {
      console.log('Erro crítico, usando categorias padrão:', error);
      setCategories(defaultCategories.map(name => ({ id: name, name })));
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos de acesso à galeria para anexar comprovantes.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setReceipt(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos de acesso à câmera para tirar fotos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setReceipt(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!amount || !description || !category) {
      Alert.alert('Erro', 'Por favor, preencha valor, descrição e categoria');
      return;
    }

    // Validação do valor
    const amountValue = parseFloat(amount.replace(',', '.'));
    if (isNaN(amountValue) || amountValue <= 0) {
      Alert.alert('Erro', 'Por favor, insira um valor válido maior que zero');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          type: 'expense',
          amount: amountValue,
          description,
          category: category.replace(/^[^\w]+\s/, ''), // Remove emoji para salvar
          date: date.toISOString().split('T')[0],
          receipt_url: receipt,
        });

      if (error) throw error;

      Alert.alert('✅ Sucesso', 'Despesa cadastrada com sucesso!');
      navigation.goBack();
      
    } catch (error) {
      Alert.alert('❌ Erro', 'Não foi possível cadastrar a despesa');
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

  const CategoryCard = ({ category: cat, isSelected, onPress }) => (
    <TouchableOpacity
      style={[
        styles.categoryCard,
        isSelected && styles.categoryCardSelected,
      ]}
      onPress={onPress}
    >
      <Text style={[
        styles.categoryEmoji,
        isSelected && styles.categoryEmojiSelected,
      ]}>
        {cat.name.split(' ')[0]}
      </Text>
      <Text style={[
        styles.categoryName,
        isSelected && styles.categoryNameSelected,
      ]}>
        {cat.name.split(' ').slice(1).join(' ')}
      </Text>
    </TouchableOpacity>
  );

  const ActionButton = ({ icon, title, onPress, color = '#6c757d' }) => (
    <TouchableOpacity 
      style={[styles.actionButton, { backgroundColor: color }]} 
      onPress={onPress}
    >
      <Text style={styles.actionButtonIcon}>{icon}</Text>
      <Text style={styles.actionButtonText}>{title}</Text>
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
          <Text style={styles.headerTitle}>Nova Despesa</Text>
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
              <Text style={styles.inputLabel}>💵 Valor da Despesa</Text>
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
                placeholder="Ex: Almoço no restaurante"
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

            {/* Seção de Categorias */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📂 Categoria</Text>
              <Text style={styles.sectionSubtitle}>
                Selecione a categoria da despesa
              </Text>
              
              <View style={styles.categoriesGrid}>
                {categories.map((cat) => (
                  <CategoryCard
                    key={cat.id || cat.name}
                    category={cat}
                    isSelected={category === cat.name}
                    onPress={() => setCategory(cat.name)}
                  />
                ))}
              </View>

              {/* Categoria Selecionada */}
              {category && (
                <View style={styles.selectedCategoryBadge}>
                  <Text style={styles.selectedCategoryText}>
                    ✅ Selecionada: <Text style={styles.selectedCategoryName}>
                      {category.replace(/^[^\w]+\s/, '')}
                    </Text>
                  </Text>
                </View>
              )}
            </View>

            {/* Seção de Comprovante */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📎 Comprovante</Text>
              <Text style={styles.sectionSubtitle}>
                Anexe um comprovante (opcional)
              </Text>
              
              {receipt && (
                <View style={styles.receiptContainer}>
                  <Image source={{ uri: receipt }} style={styles.receiptImage} />
                  <TouchableOpacity 
                    style={styles.removeReceiptButton}
                    onPress={() => setReceipt(null)}
                  >
                    <Text style={styles.removeReceiptText}>🗑️ Remover</Text>
                  </TouchableOpacity>
                </View>
              )}
              
              <View style={styles.receiptActions}>
                <ActionButton
                  icon="📁"
                  title="Galeria"
                  onPress={pickImage}
                  color="#667eea"
                />
                <ActionButton
                  icon="📷"
                  title="Câmera"
                  onPress={takePhoto}
                  color="#764ba2"
                />
              </View>
            </View>

            {/* Botão de Submit */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                loading && styles.submitButtonDisabled,
                (!amount || !description || !category) && styles.submitButtonInactive
              ]}
              onPress={handleSubmit}
              disabled={loading || !amount || !description || !category}
            >
              <Text style={styles.submitButtonIcon}>💸</Text>
              <Text style={styles.submitButtonText}>
                {loading ? 'Cadastrando...' : 'Cadastrar Despesa'}
              </Text>
            </TouchableOpacity>
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
    backgroundColor: '#FF6B6B',
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
    color: '#FF6B6B',
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
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryCardSelected: {
    backgroundColor: '#FF6B6B',
    borderColor: '#FF6B6B',
    transform: [{ scale: 1.05 }],
  },
  categoryEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  categoryEmojiSelected: {
    color: 'white',
  },
  categoryName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#495057',
    textAlign: 'center',
  },
  categoryNameSelected: {
    color: 'white',
  },
  selectedCategoryBadge: {
    backgroundColor: '#e8f5e8',
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  selectedCategoryText: {
    fontSize: 14,
    color: '#2e7d32',
  },
  selectedCategoryName: {
    fontWeight: 'bold',
  },
  receiptContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  receiptImage: {
    width: '100%',
    height: 200,
    borderRadius: 15,
    marginBottom: 10,
  },
  removeReceiptButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  removeReceiptText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  receiptActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 15,
    marginHorizontal: 5,
  },
  actionButtonIcon: {
    fontSize: 16,
    marginRight: 8,
    color: 'white',
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  submitButton: {
    backgroundColor: '#FF6B6B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderRadius: 15,
    marginTop: 10,
    shadowColor: '#FF6B6B',
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
});
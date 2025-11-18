import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ScrollView, Image, Animated, Dimensions,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../config/supabase';

const { width } = Dimensions.get('window');

export default function ExpensesScreen({ navigation }) {
  // Estados do formulário
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [receipt, setReceipt] = useState(null); // Armazena a URI local da imagem do comprovante
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // Animações
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(30))[0];

  // Categorias padrão
  const defaultCategories = [
    '🍔 Alimentação', '🚗 Transporte', '🏠 Moradia', '🏥 Saúde', 
    '🎓 Educação', '🎮 Lazer', '🛍️ Compras', '📦 Outros'
  ];

  useEffect(() => {
    loadCategories();
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1, duration: 600, useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0, duration: 500, useNativeDriver: true,
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

      if (error) throw error;
      
      setCategories(data.length === 0 ? 
        defaultCategories.map(name => ({ id: name, name })) : 
        data
      );
    } catch (error) {
      console.log('Erro ao carregar categorias:', error);
      setCategories(defaultCategories.map(name => ({ id: name, name })));
    }
  };

  //  FUNÇÃO DE UPLOAD DO COMPROVANTE 

  const uploadImageToSupabase = async (imageUri) => {
    try {
      //  VERIFICAÇÃO INICIAL: Se não há imagem, retorna null
      if (!imageUri) {
        console.log('❌ Nenhuma imagem fornecida para upload');
        return null;
      }

      console.log('🔄 Iniciando processo de upload do comprovante...');
      console.log('📁 URI local da imagem:', imageUri);

      //  PREPARAÇÃO DO ARQUIVO
      console.log('📝 ETAPA 1: Preparando arquivo...');
      
      // Extrai o nome do arquivo da URI (ex: 'image.jpg' de 'file:///.../image.jpg')
      const filename = imageUri.split('/').pop();
      console.log('📄 Nome original do arquivo:', filename);
      
      // Cria um nome único usando timestamp + nome original
      //  ISSO EVITA CONFLITOS: se dois usuários fizerem upload ao mesmo tempo
      const uniqueFilename = `${Date.now()}_${filename}`;
      console.log('🆕 Nome único gerado:', uniqueFilename);

      // ==================== ETAPA 2: CONVERSÃO PARA BLOB ====================
      console.log('🔄 ETAPA 2: Convertendo imagem para formato binário...');
      
      const response = await fetch(imageUri);
      console.log('✅ Conversão fetch concluída');
      
      // Converte a resposta para BLOB (dados binários)
      const blob = await response.blob();
      console.log('📦 Arquivo convertido para Blob, tamanho:', blob.size, 'bytes');
      console.log('📊 Tipo do Blob:', blob.type);

      //  UPLOAD PARA SUPABASE STORAGE
      console.log('🚀 ETAPA 3: Iniciando upload para Supabase Storage...');
      
      //  FAZ UPLOAD PARA O BUCKET 'receipts' NO SUPABASE:
      const { data, error } = await supabase.storage
        .from('receipts') // Nome do bucket onde os comprovantes serão armazenados
        .upload(uniqueFilename, blob, { 
          contentType: 'image/jpeg', // Tipo do conteúdo (para o Supabase saber como armazenar)
          upsert: false
        });

      // VERIFICAÇÃO DE ERRO NO UPLOAD:
      if (error) {
        console.error('💥 ERRO NO UPLOAD:', error);
        console.error('📋 Detalhes do erro:', {
          message: error.message,
          code: error.code,
          details: error.details
        });
        return null; // Retorna null indicando falha no upload
      }

      console.log('✅ Upload realizado com sucesso!');
      console.log('📦 Dados retornados pelo Supabase:', data);

      // OBTENÇÃO DA URL PÚBLICA
      console.log('🔗 ETAPA 4: Gerando URL pública do comprovante...');
      
      // GERA URL PÚBLICA para acessar a imagem:
      const publicUrl = supabase.storage
        .from('receipts')        
        .getPublicUrl(uniqueFilename);

      console.log('🎯 URL pública gerada com sucesso:', publicUrl.data.publicUrl);
      
      // RETORNA A URL PÚBLICA para ser salva no banco de dados
      return publicUrl.data.publicUrl;

    } catch (error) {
      // CAPTURA ERROS GERAIS (ex: rede, conversão, permissões)
      console.error('💥 ERRO CRÍTICO NO PROCESSAMENTO:', error);
      console.error('🔍 Stack trace:', error.stack);
      return null; // Retorna null em caso de erro catastrófico
    }
  };


  // FUNÇÕES PARA CAPTURAR IMAGEM (GALERIA E CÂMERA)
  const pickImage = async () => {
    //  SOLICITA PERMISSÃO para acessar a galeria
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos de acesso à galeria para anexar comprovantes.');
      return;
    }

    //  ABRE A GALERIA de imagens do dispositivo
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, // Apenas imagens (não vídeos)
      allowsEditing: true,      // Permite editar/cortar a imagem
      aspect: [4, 3],           // Proporção da imagem (4:3)
      quality: 0.8,             // Qualidade (0.0 a 1.0) - 80%
    });

    // SE O USUÁRIO SELECIONOU UMA IMAGEM (não cancelou)
    if (!result.canceled) {
      console.log('🖼️ Imagem selecionada da galeria:', result.assets[0].uri);
      //  SALVA A URI LOCAL no estado (ainda não fez upload)
      setReceipt(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    // SOLICITA PERMISSÃO para acessar a câmera
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos de acesso à câmera para tirar fotos dos comprovantes.');
      return;
    }

    // ABRE A CÂMERA do dispositivo
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,      //  Permite editar/cortar a foto
      aspect: [4, 3],           //  Proporção da foto (4:3)
      quality: 0.8,             //  Qualidade (0.0 a 1.0) - 80%
    });

    // SE O USUÁRIO TIROU FOTO (não cancelou)
    if (!result.canceled) {
      console.log('📸 Foto tirada com câmera:', result.assets[0].uri);
      // SALVA A URI LOCAL no estado (ainda não fez upload)
      setReceipt(result.assets[0].uri);
    }
  };
  
  // FUNÇÃO PRINCIPAL - ENVIO DO FORMULÁRIO COMPLETO
  const handleSubmit = async () => {
    // VALIDAÇÕES BÁSICAS dos campos obrigatórios
    if (!amount || !description || !category) {
      Alert.alert('Erro', 'Por favor, preencha valor, descrição e categoria');
      return;
    }

    // CONVERSÃO E VALIDAÇÃO do valor monetário
    const amountValue = parseFloat(amount.replace(',', '.'));
    if (isNaN(amountValue) || amountValue <= 0) {
      Alert.alert('Erro', 'Por favor, insira um valor válido maior que zero');
      return;
    }

    // ATIVA ESTADO DE CARREGAMENTO (mostra feedback visual)
    setLoading(true);
    
    try {
      // VARIÁVEL CRÍTICA: armazenará a URL do comprovante no SUPABASE
      let receiptUrl = null;
      
      // PARTE QUE ENVIA O COMPROVANTE PARA O SUPABASE
      if (receipt) { // VERIFICA SE O USUÁRIO SELECIONOU UM COMPROVANTE
        console.log(' ');
        
        // CHAMA A FUNÇÃO DE UPLOAD E AGUARDA O RESULTADO
        receiptUrl = await uploadImageToSupabase(receipt);
        
        // VERIFICA SE O UPLOAD FOI BEM SUCEDIDO
        if (receiptUrl) {
          console.log('✅ ✅ ✅ UPLOAD CONCLUÍDO COM SUCESSO!');
          console.log('🔗 URL do comprovante no Supabase:', receiptUrl);
        } else {
          console.log('❌ ❌ ❌ FALHA NO UPLOAD DO COMPROVANTE');
          console.log('ℹ️ Continuando o cadastro sem o comprovante...');
        }
        console.log('📤 =================================');
        console.log(' ');
      } else {
        console.log('ℹ️ Nenhum comprovante para fazer upload');
      }

      // SALVAMENTO NO BANCO DE DADOS
      console.log('💾 Salvando dados da despesa no banco...');
      
      const { error } = await supabase
        .from('transactions') //  Tabela onde serão salvas as transações
        .insert({
          user_id: user.id,     //  ID do usuário logado
          type: 'expense',      //  Tipo: despesa (não receita)
          amount: amountValue,  //  Valor convertido para número
          description,          //  Descrição da despesa
          category: category.replace(/^[^\w]+\s/, ''), //  Remove emoji do nome
          date: date.toISOString().split('T')[0], //  Data no formato YYYY-MM-DD
          receipt_url: receiptUrl, // URL DO COMPROVANTE NO SUPABASE STORAGE 
        });

      //  VERIFICA ERRO NA INSERÇÃO NO BANCO
      if (error) {
        console.error('💥 Erro ao salvar no banco:', error);
        throw error; // Lança o erro para ser capturado no catch
      }

      // SUCESSO TOTAL
      console.log('🎉 🎉 🎉 DESPESA CADASTRADA COM SUCESSO!');
      Alert.alert('✅ Sucesso', 'Despesa cadastrada com sucesso!');
      
      //  VOLTA PARA TELA ANTERIOR
      navigation.goBack();
      
    } catch (error) {
      //  TRATAMENTO DE ERROS
      console.error('💥 Erro detalhado ao cadastrar despesa:', error);
      Alert.alert('❌ Erro', 'Não foi possível cadastrar a despesa');
    } finally {
      // FINALIZA O PROCESSO (executa sempre, mesmo com erro)
      setLoading(false); //  Desativa estado de carregamento
    }
  };

  // Função para formatar valor monetário
  const handleAmountChange = (text) => {
    const cleanedText = text.replace(/[^0-9,.]/g, '');
    const formattedText = cleanedText.replace(',', '.');
    
    if (formattedText === '' || !isNaN(formattedText)) {
      setAmount(cleanedText);
    }
  };

  // Componente de categoria
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

  // Botão de ação
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
      {/* Header */}
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
      >
        <Animated.View 
          style={[
            styles.formContainer,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
          ]}
        >
          <View style={styles.formCard}>
            
            {/* Valor */}
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
                />
              </View>
            </View>

            {/* Descrição */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>📝 Descrição</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Ex: Almoço no restaurante"
                value={description}
                onChangeText={setDescription}
              />
            </View>

            {/* Data */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>📅 Data</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
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

            {/* Categorias */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📂 Categoria</Text>
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
            </View>

            {/* 🖼️ Seção do Comprovante */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📎 Comprovante (Opcional)</Text>
              
              {/* Preview do comprovante */}
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
              
              {/* Botões para adicionar comprovante */}
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

            {/* Botão enviar */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                loading && styles.submitButtonDisabled,
                (!amount || !description || !category) && styles.submitButtonInactive
              ]}
              onPress={handleSubmit}
              disabled={loading || !amount || !description || !category}
            >
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

// Estilos (mantidos iguais)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  headerGradient: {
    backgroundColor: '#FF6B6B', paddingTop: 60, paddingBottom: 20,
    borderBottomLeftRadius: 30, borderBottomRightRadius: 30,
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 25,
  },
  backButton: { padding: 10, borderRadius: 12 },
  backButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: 'white' },
  headerPlaceholder: { width: 40 },
  scrollView: { flex: 1, marginTop: -20 },
  formContainer: { padding: 20 },
  formCard: {
    backgroundColor: 'white', borderRadius: 25, padding: 25,
    shadowColor: '#000', shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.05, shadowRadius: 15, elevation: 5,
  },
  inputGroup: { marginBottom: 25 },
  inputLabel: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 10 },
  amountContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8f9fa',
    borderRadius: 15, paddingHorizontal: 20, borderWidth: 2, borderColor: '#e9ecef',
  },
  currencySymbol: { fontSize: 20, fontWeight: 'bold', color: '#495057', marginRight: 10 },
  amountInput: { flex: 1, fontSize: 24, fontWeight: 'bold', color: '#FF6B6B', paddingVertical: 15 },
  textInput: {
    backgroundColor: '#f8f9fa', borderRadius: 15, padding: 20, fontSize: 16,
    borderWidth: 2, borderColor: '#e9ecef',
  },
  dateButton: {
    backgroundColor: '#f8f9fa', borderRadius: 15, padding: 20,
    borderWidth: 2, borderColor: '#e9ecef',
  },
  dateButtonText: { fontSize: 16, color: '#333' },
  section: { marginBottom: 30 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  categoriesGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  categoryCard: {
    width: '48%', backgroundColor: '#f8f9fa', borderRadius: 15, padding: 15,
    alignItems: 'center', marginBottom: 12, borderWidth: 2, borderColor: 'transparent',
  },
  categoryCardSelected: { backgroundColor: '#FF6B6B', borderColor: '#FF6B6B' },
  categoryEmoji: { fontSize: 24, marginBottom: 8 },
  categoryEmojiSelected: { color: 'white' },
  categoryName: { fontSize: 12, fontWeight: 'bold', color: '#495057', textAlign: 'center' },
  categoryNameSelected: { color: 'white' },
  receiptContainer: { alignItems: 'center', marginBottom: 15 },
  receiptImage: { width: '100%', height: 200, borderRadius: 15, marginBottom: 10 },
  removeReceiptButton: { backgroundColor: '#FF6B6B', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  removeReceiptText: { color: 'white', fontWeight: 'bold' },
  receiptActions: { flexDirection: 'row', justifyContent: 'space-between' },
  actionButton: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    padding: 15, borderRadius: 15, marginHorizontal: 5,
  },
  actionButtonIcon: { fontSize: 16, marginRight: 8, color: 'white' },
  actionButtonText: { color: 'white', fontWeight: 'bold' },
  submitButton: { backgroundColor: '#FF6B6B', padding: 20, borderRadius: 15, alignItems: 'center' },
  submitButtonDisabled: { backgroundColor: '#ccc' },
  submitButtonInactive: { backgroundColor: '#dee2e6' },
  submitButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});

import React, { useState, useEffect } from 'react';
import { View, FlatList, TextInput, Text, StyleSheet, ActivityIndicator, Alert, Image, ImageBackground, TouchableOpacity } from 'react-native';
import { addReport, getReports } from './localDatabase'; 
import * as Location from 'expo-location';
import axios from 'axios'; 
import * as ImagePicker from 'expo-image-picker';

const ReportScreen = () => {
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState(null);
  const [currentLocation, setCurrentLocation] = useState('');
  const [loading, setLoading] = useState(false); 
  const [image, setImage] = useState(null);
  const [reports, setReports] = useState([]);

  // pegando a  localização do usúario ao ele entrar no app e permitir
  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão negada', 'Permissão para acessar localização não concedida.');
        return;
      }

      const { coords } = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setLocation({ latitude: coords.latitude, longitude: coords.longitude });
      await fetchAddress(coords.latitude, coords.longitude); 
    } catch (error) {
      console.error("Erro ao obter localização:", error);
      Alert.alert('Erro', 'Não foi possível obter sua localização.');
            // Exibe um alerta se tiver um erro ao obter a localização.
    }
  };

  // Função para converter latitude e longitude em um texto de endereço.
  const fetchAddress = async (latitude, longitude) => {
    try {
      const response = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=pt`, {
        headers: {
          'User-Agent': 'Daniel/1.0 (dvs.daniel1@gmail.com)',
        },
      });
      const { display_name } = response.data;
      setCurrentLocation(display_name.split(',')[0]);
    } catch (error) {
      console.error("Erro ao obter endereço:", error);
      Alert.alert('Erro', 'Não foi possível obter o endereço.');
    }
  };

  // pegando a imagem que o usuário vai inserir
  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão negada', 'Você precisa conceder permissão para acessar a galeria.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });

      if (result && !result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0].uri;
        setImage(selectedImage);
      }
    } catch (error) {
      console.error("Erro na função pickImage:", error);
      Alert.alert('Erro', 'Ocorreu um erro ao selecionar a imagem.');
    }
  };

  // permissão para tirar foto falta verificar como corrigir o erro ao subir a foto
  const tirarFoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão negada', 'Você precisa conceder permissão para acessar a câmera.');
        return;
      }
  
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });
  
      if (result && !result.cancelled && result.uri) {
        setImage(result.uri);
      }
    } catch (error) {
      console.error("Erro na função tirarFoto:", error);
      Alert.alert('Erro', 'Ocorreu um erro ao capturar a imagem.');
    }
  };

  // Subindo a imagem para o imgur
  const uploadImage = async (uri) => {
    const clientId = '17df59562cbcf48'; 
    const formData = new FormData();
    formData.append('image', {
      uri: uri,
      name: 'report-image.jpg',
      type: 'image/jpeg',
    });

    try {
      // API ONDE ESTAMOS SUBINDO A IMAGEM PARA ARMAZENAR
      const response = await axios.post('https://api.imgur.com/3/image', formData, {
        headers: {
          Authorization: `Client-ID ${clientId}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.data.link; 
    } catch (error) {
      console.error("Erro ao enviar imagem:", error);
      Alert.alert('Erro', 'Não foi possível enviar a imagem.');
      return null;
    }
  };

  useEffect(() => {
    getCurrentLocation();   
  }, []);

  // Subir todos os dados após preencher tudo
  const submitReport = async () => {
    if (!description || !location || !image) {
      Alert.alert('Atenção', 'Preencha todos os campos antes de enviar.');
      return;
    }

    setLoading(true); 

    const imageUrl = await uploadImage(image); 

    if (typeof imageUrl !== 'string') {
      Alert.alert('Erro', 'Ocorreu um erro ao enviar a imagem.');
      setLoading(false);
      return;
    }
  
    // Dados do report
    const report = {
      id: new Date().getTime().toString(),
      description: String(description) || '', 
      location: JSON.stringify(location),      
      currentLocation: String(currentLocation) || '', 
      imageUrl: String(imageUrl) || '',   
    };

    addReport(report); 
    setLoading(false);
  };

  useEffect(() => {
    const fetchReports = async () => {
      const fetchedReports = await getReports();
      setReports(fetchedReports);
    };

    fetchReports();
  }, []);

  return (
    <ImageBackground
      source={{ uri: 'https://tse1.mm.bing.net/th?id=OIG3.nS7nK4g9Cp_1yf4gzYR_&pid=ImgGn' }} // Imagem de fundo
      style={styles.background}
    >
      <View style={styles.container}>
        <View style={styles.box}>
          {/* Realizar o input do problema */}
          <TextInput
            style={styles.input}
            placeholder="Descreva o problema"
            value={description}
            onChangeText={setDescription}
          />
          {/* Funçao para tirar uma foto porém precisamos corrigir */}
          <TouchableOpacity style={styles.button} onPress={tirarFoto}>
            <Text style={styles.buttonText}>Tirar Foto</Text>
          </TouchableOpacity>

          {/* Botão para selecionar a imagem da denuncia acho que corrigi */}
          {image && <Image source={{ uri: image }} style={styles.image} />}
          <TouchableOpacity style={styles.button} onPress={pickImage}>
            <Text style={styles.buttonText}>Selecionar Imagem</Text>
          </TouchableOpacity>
          
          {/* Botão para enviar a denuncia */}
          {loading ? (
            <ActivityIndicator size="large" color="#4CAF50" />
          ) : (
            <TouchableOpacity style={styles.button} onPress={submitReport}>
              <Text style={styles.buttonText}>Enviar Denúncia</Text>
            </TouchableOpacity>
          )}

          {/* Localização do usúario */}
          {currentLocation && (
            <Text style={styles.locationText}>
              Localização atual: {currentLocation}
            </Text>
          )}

          {/* Criei isso só para mostrarmos para o professor o banco de dados funcionando */}
          <Text style={styles.locationText}>Visualização do banco de dados</Text>
          <FlatList
            data={reports}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.reportItem}>
                <Text>{item.description}</Text>
                <Text>{item.currentLocation}</Text>
                <Text>{item.imageUrl}</Text>
              </View>
            )}
          />
        </View>
      </View>
    </ImageBackground>
  );
};

// Toda a estilização
const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: 'cover',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    
  },
  box: {
    padding: 20,
    backgroundColor: 'rgba(144, 238, 144, 0.5)', // Verde claro translúcido
    borderRadius: 15,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    width: '90%',
    
  },
  input: {
    height: 40,
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)', // cor da caixa do descreva o problema
    borderRadius: 5,
    fontWeight: 'bold', 

  },
  locationText: {
    marginTop: 10,
    fontSize: 16,
    textAlign: 'center',
    color: '#FFFFFF', 
    fontWeight: 'bold', 
  },
  image: {
    width: 100,
    height: 100,
    marginTop: 10,
    borderRadius: 8,
  },
  reportItem: {
    backgroundColor: '#4CAF50',
    padding: 10,
    marginVertical: 5,
    borderRadius: 5,
    
  },
  button: {
    backgroundColor: '#4CAF50', // cor do botão
    padding: 10, 
    borderRadius: 5,
    alignItems: 'center',
    marginVertical: 5,
  },
  buttonText: {
    color: '#FFFFFF', // cor branca 
    fontSize: 16, // tamanho da fonte
    fontWeight: 'bold', // texto fica em negrito negrito

  },
  locationText: {
    marginTop: 10,
    fontSize: 16,
    textAlign: 'center',
    color: '#FFFFFF', // Cor principal do texto
    fontWeight: 'bold', // Negrito
    textShadowColor: '#000000', // Cor da borda
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 1,
},
});

export default ReportScreen;

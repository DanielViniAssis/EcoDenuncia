import React, { useState, useEffect } from 'react';
import { View, FlatList, Button, TextInput, Text, StyleSheet, ActivityIndicator, Alert, Image, ImageBackground  } from 'react-native';
import { addReport, getReports } from './localDatabase'; 
import * as Location from 'expo-location';
import emailjs from 'emailjs-com';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios'; 

const ReportScreen = () => {
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState(null);
  const [currentLocation, setCurrentLocation] = useState('');
  const [loading, setLoading] = useState(false); 
  const [image, setImage] = useState(null);
  const [email, setEmail] = useState('');
  const [reports, setReports] = useState([]);

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
    }
  };

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

  const [uploading, setUploading] = useState(false);

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
      base64: false,
    });

    console.log("Resultado do ImagePicker:", result);

    if (result && !result.canceled && result.assets && result.assets.length > 0) {
      const selectedImage = result.assets[0].uri;
      setImage(selectedImage);
      console.log("Imagem selecionada com URI:", selectedImage);
    } else {
      console.log("Nenhum URI de imagem encontrado ou seleção cancelada.");
    }
  } catch (error) {
    console.error("Erro na função pickImage:", error);
    Alert.alert('Erro', 'Ocorreu um erro ao selecionar a imagem.');
  }
};

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
  
      console.log("Resultado do ImagePicker (Camera):", result);
  
      if (result && !result.cancelled && result.uri) {
        setImage(result.uri);
        console.log("Imagem capturada com URI:", result.uri);
      } else {
        console.log("Nenhum URI de imagem encontrado ou captura cancelada.");
      }
    } catch (error) {
      console.error("Erro na função takePhoto:", error);
      Alert.alert('Erro', 'Ocorreu um erro ao capturar a imagem.');
    }
  };

  const uploadImage = async (uri) => {
    const clientId = '17df59562cbcf48'; 
    const formData = new FormData();
    formData.append('image', {
      uri: uri,
      name: 'report-image.jpg',
      type: 'image/jpeg',
    });
    setUploading(true);
    formData.append('image', {
      uri: uri,
      name: 'report-image.jpg',
      type: 'image/jpeg', 
    },
    setUploading(false),
    ); 

    try {
      const response = await axios.post('https://api.imgur.com/3/image', formData, {
        headers: {
          Authorization: `Client-ID ${clientId}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.data.link; 
    } catch (error) {
      console.error("Erro ao enviar imagem:",  error.response ? error.response.data : error.message.concat(" ", stringToAppend));
      Alert.alert('Erro', 'Não foi possível enviar a imagem.');
      return null;
    }
  };
  
  

  useEffect(() => {
    getCurrentLocation();   
  }, []);

//   const sendEmail = async (report) => {
//     console.log('Relatório a ser enviado:', report);
//     try {
//         const response = await axios.post('http://192.168.15.46:8081/send-email', report);
//         console.log('Resposta do servidor:', response.data); 

//         if (response.data && response.data.message) {
//             Alert.alert('Sucesso', response.data.message); 
//         } else {
//             Alert.alert('Erro', 'O servidor não retornou uma mensagem de sucesso válida.');
//         }
//     } catch (error) {
//         console.error('Erro ao enviar e-mail:', error);
//         Alert.alert('Erro', 'Não foi possível enviar o e-mail.');
//     }
// };

  const submitReport = async () => {
    console.log('Descrição:', description);
    // console.log('E-mail:', email);
    console.log('Localização:', location);
    console.log('Imagem:', image);
    
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
  
    const report = {
      id: new Date().getTime().toString(),
      description: String(description) || '', 
      location: JSON.stringify(location),      
      currentLocation: String(currentLocation) || '', 
      imageUrl: String(imageUrl) || '',   
    };
  
    console.log('Relatório a ser enviado:', report);
  
    addReport(report); 
    console.log('Relatórios atuais:', getReports()); 
  
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
      source={{ uri: 'https://tse1.mm.bing.net/th?id=OIG3.nS7nK4g9Cp_1yf4gzYR_&pid=ImgGn' }} // Use uma imagem de natureza ou floresta
      style={styles.background}
    >
      <View style={styles.container}>
        <View style={styles.box}>
          <TextInput
            style={styles.input}
            placeholder="Descreva o problema"
            value={description}
            onChangeText={setDescription}
          />
          <Button title="Tirar Foto" onPress={tirarFoto} />
          {image && <Image source={{ uri: image }} style={styles.image} />}
          <Button title="Selecionar Imagem" onPress={pickImage} />
          
          {uploading && <ActivityIndicator size="large" color="#4CAF50" />}
          {loading ? (
            <ActivityIndicator size="large" color="#4CAF50" />
          ) : (
            <Button title="Enviar Denúncia" onPress={submitReport} />
          )}
          {currentLocation && (
            <Text style={styles.locationText}>
              Localização atual: {currentLocation}
            </Text>
          )}
          <Text style={styles.locationText}>Vizualização do banco de dados</Text>
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
    backgroundColor: 'rgba(9,255,29, 0.8)',
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    width: '90%',
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)', // Fundo branco com opacidade alta
    borderRadius: 5,
  },
  locationText: {
    marginTop: 10,
    fontSize: 16,
    textAlign: 'center',
    color: '#333',
  },
  image: {
    width: 100,
    height: 100,
    marginTop: 10,
    borderRadius: 8,
  },
  reportItem: {
    backgroundColor: '#4CAF50', // Fundo verde para os itens de denúncia
    padding: 10,
    marginVertical: 5,
    borderRadius: 5,
  },
});

export default ReportScreen;

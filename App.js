import React, { useState, useEffect } from 'react';
import { View, Button, TextInput, Text, StyleSheet, ActivityIndicator, Alert, Image } from 'react-native';
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

  const pickImage = async () => {
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

    if (!result.cancelled) {
      setImage(result.uri);
    } else {
      console.log("Seleção de imagem cancelada.");
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

    try {
      const response = await axios.post('https://api.imgur.com/3/image', formData, {
        headers: {
          Authorization: `Client-ID ${clientId}`,
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

  const sendEmail = async (report) => {
    try {
      await emailjs.send("service_dfx6yf9", "template_069iy3w", report, "GOQnxaaZTxRwazEPO");
      Alert.alert('Sucesso', 'E-mail enviado com sucesso!');
    } catch (error) {
      console.error('Erro ao enviar e-mail:', error);
      Alert.alert('Erro', 'Não foi possível enviar o e-mail.');
    }
  };

  const submitReport = async () => {
    console.log('Descrição:', description);
    console.log('E-mail:', email);
    console.log('Localização:', location);
    console.log('Imagem:', image);

    if (!description || !location || !image || !email) {
      Alert.alert('Atenção', 'Preencha todos os campos antes de enviar.');
      return;
    }

    setLoading(true); 

    const imageUrl = await uploadImage(image); 

    if (!imageUrl) {
      setLoading(false);
      return;
    }

    const report = {
      description,
      location: JSON.stringify(location),
      currentLocation,
      imageUrl,
      email,
    };

    await sendEmail(report); // Envia o e-mail com os dados da denúncia
    addReport(report); // Adiciona a denúncia ao banco de dados local
    console.log('Relatórios atuais:', getReports()); 

    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Descreva o problema"
        value={description}
        onChangeText={setDescription}
      />
      <TextInput
        style={styles.input}
        placeholder="Seu e-mail"
        value={email}
        onChangeText={setEmail}
      />
      <Button title="Selecionar Imagem" onPress={pickImage} />
      {image && <Image source={{ uri: image }} style={styles.image} />}
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <Button title="Enviar Denúncia" onPress={submitReport} />
      )}
      {currentLocation && (
        <Text style={styles.locationText}>
          Localização atual: {currentLocation}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  input: {
    height: 40,
    width: '100%',
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  locationText: {
    marginTop: 10,
    fontSize: 16,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  image: {
    width: 100,
    height: 100,
    marginTop: 10,
    borderRadius: 8,
  },
});

export default ReportScreen;

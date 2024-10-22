import React, { useState, useEffect } from 'react';
import { View, Button, Image, TextInput, Text, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import axios from 'axios';

const ReportScreen = () => {
  const [image, setImage] = useState(null);
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState(null);
  const [currentLocation, setCurrentLocation] = useState('');
  const [weather, setWeather] = useState(null);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.error("Permissão para acessar localização não concedida.");
        return;
      }

      const { coords } = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setLocation({ latitude: coords.latitude, longitude: coords.longitude });
      await fetchAddress(coords.latitude, coords.longitude);
      await fetchWeather(coords.latitude, coords.longitude);
    } catch (error) {
      console.error("Erro ao obter localização:", error);
    }
  };

  const fetchAddress = async (latitude, longitude) => {
    try {
      const response = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=pt`);
      const { display_name } = response.data;
      setCurrentLocation(display_name.split(',')[0]); // Pega apenas a primeira parte do endereço
    } catch (error) {
      console.error("Erro ao obter endereço:", error);
    }
  };

  const fetchWeather = async (latitude, longitude) => {
    try {
      const response = await axios.get(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`
      );
      setWeather(response.data.current_weather);
    } catch (error) {
      if (error.response && error.response.status === 429) {
        console.error("Limite de requisições atingido. Tente novamente mais tarde.");
      } else {
        console.error("Erro ao buscar clima:", error);
      }
    }
  };

  useEffect(() => {
    getCurrentLocation(); // Chama a função para obter a localização atual do usuário
  }, []);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.cancelled) {
      setImage(result.uri);
    }
  };

  const submitReport = async () => {
    const reportData = {
      description,
      image,
      location,
      weather,
    };

    console.log(reportData);
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Descreva o problema"
        value={description}
        onChangeText={setDescription}
      />
      <Button title="Escolher Imagem" onPress={pickImage} />
      {image && <Image source={{ uri: image }} style={styles.image} />}
      {weather && (
        <Text style={styles.weatherText}>
          Clima atual: {weather.temperature}°C, Vento: {weather.windspeed} km/h
        </Text>
      )}
      {currentLocation && (
        <Text style={styles.locationText}>
          Localização atual: {currentLocation}
        </Text>
      )}
      <Button title="Enviar Denúncia" onPress={submitReport} />
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
  image: {
    width: 200,
    height: 200,
    marginTop: 10,
  },
  weatherText: {
    marginTop: 10,
    fontSize: 16,
    textAlign: 'center',
  },
  locationText: {
    marginTop: 10,
    fontSize: 16,
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

export default ReportScreen;

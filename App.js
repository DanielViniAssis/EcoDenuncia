import React, { useState, useEffect } from 'react';
import { View, Button, Image, TextInput, Text, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';

const ReportScreen = () => {
  const [image, setImage] = useState(null);
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState(null);
  const [weather, setWeather] = useState(null);

  const getLocation = async () => {
    try {
      const response = await axios.get('https://ipapi.co/json/');
      const { latitude, longitude } = response.data;
      setLocation({ latitude, longitude });
      await fetchWeather(latitude, longitude);
    } catch (error) {
      console.error("Erro ao obter localização:", error);
    }
  };

  const fetchWeather = async (latitude, longitude) => {
    try {
      const response = await axios.get(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`
      );
      setWeather(response.data.current_weather);
    } catch (error) {
      console.error("Erro ao buscar clima:", error);
    }
  };

  useEffect(() => {
    getLocation();
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
      <Button title="Enviar Denúncia" onPress={submitReport} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center', // Centraliza verticalmente
    alignItems: 'center', // Centraliza horizontalmente
    padding: 20,
  },
  input: {
    height: 40,
    width: '100%', // Ajusta a largura do input
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
    textAlign: 'center', // Centraliza o texto
  },
});

export default ReportScreen;

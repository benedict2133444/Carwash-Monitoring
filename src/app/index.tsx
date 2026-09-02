import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function OwnerLoginScreen() {
  
const [username, setUsername] = useState('');
const [password, setPassword] = useState('');
const [keepLoggedIn, setKeepLoggedIn] = useState(true);
const [errorMessage, setErrorMessage] = useState('');
const [loading, setLoading] = useState(false);

  const router = useRouter();

const handleLogin = async () => {
  setErrorMessage('');

  if (!username.trim() || !password) {
    setErrorMessage('Please enter your email and password.');
    return;
  }

  setLoading(true);

  const { error } = await supabase.auth.signInWithPassword({
    email: username.trim(),
    password,
  });

  setLoading(false);

  if (error) {
    setErrorMessage('Invalid email or password.');

    // Clear the fields so the user can try another account
    setUsername('');
    setPassword('');

    return;
  }

  router.replace('/dashboard');
};
  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.loginCard}>
          <Image
            source={require('@/assets/images/bubble-buddies-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />

          <Text style={styles.title}>Owner Login</Text>

          <TextInput
            style={styles.input}
            placeholder="Username or Email"
            placeholderTextColor="#999999"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#999999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />
{errorMessage ? (
  <Text style={styles.errorMessage}>
    {errorMessage}
  </Text>
) : null}
          <Pressable
            style={styles.checkboxRow}
            onPress={() => setKeepLoggedIn(!keepLoggedIn)}
          >
            <View
              style={[
                styles.checkbox,
                keepLoggedIn && styles.checkboxChecked,
              ]}
            >
              {keepLoggedIn && <Text style={styles.checkmark}>✓</Text>}
            </View>

            <Text style={styles.checkboxText}>Keep me log in</Text>
          </Pressable>

          <Pressable
  disabled={loading}
  style={({ pressed }) => [
    styles.loginButton,
    pressed && styles.loginButtonPressed,
    loading && { opacity: 0.6 },
  ]}
  onPress={handleLogin}
>
            <Text style={styles.loginButtonText}>
  {loading ? 'LOGGING IN...' : 'LOGIN'}
</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({

  errorMessage: {
  width: '100%',
  color: '#FF6B6B',
  fontSize: 10,
  marginTop: -5,
  marginBottom: 8,
  textAlign: 'left',
},

  safeArea: {
    flex: 1,
    backgroundColor: '#6AA3DD',
  },

  keyboardView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },

  loginCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#383838',
    borderRadius: 26,
    paddingHorizontal: 10,
    paddingTop: 12,
    paddingBottom: 17,
    alignItems: 'center',
  },

  logo: {
    width: 110,
    height: 110,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 8,
  },

  title: {
    color: '#E5E5E5',
    fontSize: 14,
    fontWeight: '400',
    marginBottom: 11,
  },

  input: {
    width: '100%',
    height: 25,
    backgroundColor: '#5A5A5A',
    borderRadius: 4,
    paddingHorizontal: 7,
    paddingVertical: 0,
    color: '#FFFFFF',
    fontSize: 12,
    marginBottom: 11,
  },

  checkboxRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },

  checkbox: {
    width: 13,
    height: 13,
    borderWidth: 1,
    borderColor: '#777777',
    borderRadius: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 5,
    marginRight: 5,
  },

  checkboxChecked: {
    backgroundColor: '#4B00FF',
    borderColor: '#4B00FF',
  },

  checkmark: {
    color: '#FFFFFF',
    fontSize: 10,
    lineHeight: 11,
    fontWeight: '700',
  },

  checkboxText: {
    color: '#8F8F8F',
    fontSize: 12,
  },

  loginButton: {
    width: '100%',
    height: 31,
    backgroundColor: '#4B00FF',
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loginButtonPressed: {
    opacity: 0.75,
  },

  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
});
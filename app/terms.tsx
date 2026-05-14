import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

export default function TermsScreen() {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>Voltar</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Termos de Uso</Text>
                <View style={{ width: 60 }} /> {/* Espaçador para centralizar o título */}
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text style={styles.title}>Termos e Condições do SoulSurf</Text>
                <Text style={styles.text}>
                    Bem-vindo ao SoulSurf! Ao utilizar nosso aplicativo, você concorda em compartilhar
                    boas energias e respeitar o localismo de forma saudável (brincadeira, mas é sério).
                </Text>
                <Text style={styles.text}>
                    1. Privacidade: Seus dados estão seguros conosco e não serão vendidos.
                    {'\n\n'}
                    2. Uso: Este aplicativo foi desenvolvido para a comunidade do surf. O uso indevido
                    pode resultar em banimento.
                    {'\n\n'}
                    3. Responsabilidade: As condições do mar e previsão do tempo são fornecidas por APIs
                    terceirizadas. Sempre olhe o mar antes de entrar!
                </Text>
                {/* Você e o Valentim podem adicionar o texto real depois */}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F6F4EB',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E8E5D4',
    },
    backButton: {
        padding: 8,
    },
    backButtonText: {
        color: '#5C9DB8',
        fontSize: 16,
        fontWeight: 'bold',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    scrollContent: {
        padding: 20,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#333',
    },
    text: {
        fontSize: 16,
        color: '#666',
        lineHeight: 24,
    },
});
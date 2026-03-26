import { fireEvent, render } from '@testing-library/react-native';
import { router } from 'expo-router';
import React from 'react';
import LoginScreen from '../index'; // Importa a sua tela de login

// 1. Criamos um "MOCK" (uma simulação) do expo-router para o teste não tentar abrir telas de verdade
jest.mock('expo-router', () => ({
    router: {
        replace: jest.fn(),
        push: jest.fn(),
    }
}));

describe('Fluxo de Autenticação - Tela de Login', () => {

    it('deve renderizar os campos de email, senha e o botão de entrar', () => {
        const { getByPlaceholderText, getByText } = render(<LoginScreen />);

        // Verifica se os elementos visuais existem na tela
        expect(getByPlaceholderText('E-mail ou Usuário')).toBeTruthy();
        expect(getByPlaceholderText('Senha')).toBeTruthy();
        expect(getByText('Entrar')).toBeTruthy();
    });

    it('deve redirecionar para a área logada ao clicar em Entrar', () => {
        const { getByPlaceholderText, getByText } = render(<LoginScreen />);

        // Encontra os inputs e o botão
        const emailInput = getByPlaceholderText('E-mail ou Usuário');
        const passwordInput = getByPlaceholderText('Senha');
        const loginButton = getByText('Entrar');

        // Simula o usuário digitando os dados e clicando no botão
        fireEvent.changeText(emailInput, 'thiago@soulsurf.com');
        fireEvent.changeText(passwordInput, 'senha123');
        fireEvent.press(loginButton);

        // Verifica se o aplicativo tentou navegar para a tela principal /(tabs)
        expect(router.replace).toHaveBeenCalledWith('/(tabs)');
    });

    it('deve redirecionar para a tela de cadastro ao clicar no link', () => {
        const { getByText } = render(<LoginScreen />);

        // Encontra o botão de cadastro e clica
        const registerButton = getByText('Cadastre-se');
        fireEvent.press(registerButton);

        // Verifica se a rota chamada foi a de /register
        expect(router.push).toHaveBeenCalledWith('/register');
    });

});
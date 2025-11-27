import React from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../integrations/supabase/client';

const LoginPage: React.FC = () => {
    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-50">
            <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
                 <div className="text-center">
                    <img src="/LOGO LARANJA.png" alt="Logo" className="w-32 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-dark-text">Acesse sua Conta</h2>
                    <p className="text-light-text">Salve e gerencie suas simulações financeiras.</p>
                </div>
                <Auth
                    supabaseClient={supabase}
                    appearance={{ theme: ThemeSupa }}
                    providers={[]}
                    theme="light"
                    localization={{
                        variables: {
                            sign_in: {
                                email_label: 'Seu email',
                                password_label: 'Sua senha',
                                button_label: 'Entrar',
                                link_text: 'Já tem uma conta? Entre aqui',
                                social_provider_text: 'Entrar com {{provider}}'
                            },
                            sign_up: {
                                email_label: 'Seu email',
                                password_label: 'Sua senha',
                                button_label: 'Registrar',
                                link_text: 'Não tem uma conta? Registre-se',
                            },
                             forgotten_password: {
                                email_label: 'Seu email',
                                password_label: 'Sua senha',
                                button_label: 'Enviar instruções',
                                link_text: 'Esqueceu sua senha?',
                            },
                        },
                    }}
                />
            </div>
        </div>
    );
};

export default LoginPage;
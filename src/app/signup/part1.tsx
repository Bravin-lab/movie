"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function SignupPagePart1() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!username) {
      setError('Username is required');
      setLoading(false);
      return;
    }
    if (!email) {
      setError('Email is required');
      setLoading(false);
      return;
    }
    if (!password) {
      setError('Password is required');
      setLoading(false);
      return;
    }

    // Proceed with signup logic here or navigate to next signup step
    // For example, you might want to save these details in context or local storage
    // and navigate to part2 of signup

    setLoading(false);
  };

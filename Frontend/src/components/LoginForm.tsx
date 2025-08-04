// import React, { useState } from 'react';
import { useForm } from '@tanstack/react-form'

import Input from '@/components/Input';
import Label from '@/components/Label';
import Button from '@/components/Button';

export interface LoginFormData {
  email: string;
  password: string;
}

export interface LoginFormProps {
  onSubmit: (data: LoginFormData) => void;
}

const LoginForm = (props: LoginFormProps): React.JSX.Element => {
  const { onSubmit } = props;

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    onSubmit: async ({ value }: { value: LoginFormData }) => {
      onSubmit(value);
    }
  });

  return (
    <div className="items-center">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className="flex flex-col"
      >
        <div>
          {/** Field: email **/}
          <form.Field
            name="email"
            validators={{
              onChange: ({ value }) => {
                return !value ? 
                  'Email required'
                  : value.length < 3
                    ? 'Email must be at least three characters long'
                    : undefined;
              },
              onChangeAsyncDebounceMs: 500
            }}
            children={(field) => {
              return (
                <div
                  className="flex flex-row mb-2"
                >
                  <Label
                    htmlFor={field.name}
                    className="w-1/4 text-right"
                  >
                    Email
                  </Label>
                  <div className="w-3/4 justify-left">
                    <Input
                      id={field.name}
                      name={field.name}
                      type="email"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className="w-full"
                    />
                    {!field.state.meta.isValid && (
                      <em role="alert">{field.state.meta.errors.join(', ')}</em>
                    )}
                  </div>
                </div>
              );
            }}
          />
        </div>

        <div>
          {/** Field: password **/}
          <form.Field
            name="password"
            validators={{
              onChange: ({ value }) => {
                return !value ? 
                  'Password required'
                  : value.length < 8
                    ? 'Password must be at least eight characters long'
                    : undefined;
              },
              onChangeAsyncDebounceMs: 500
            }}
            children={(field) => {
              return (
                <div className="flex flex-row mb-2">
                  <Label
                    htmlFor={field.name}
                    className="w-1/4 text-right"
                  >
                    Password
                  </Label>
                  <div className="w-3/4 justify-left">
                    <Input
                      id={field.name}
                      name={field.name}
                      type="password"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className="w-full"
                    />
                    {!field.state.meta.isValid && (
                      <em role="alert">{field.state.meta.errors.join(', ')}</em>
                    )}
                  </div>
                </div>
              );
            }}
          />
        </div>

        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
          children={([canSubmit, isSubmitting]) => (
            <div className="flex w-full justify-center">
              <Button
                type="submit"
                disabled={!canSubmit}
                className="bg-blue-600 hover:bg-blue-400 w-1/2"
              >
                {isSubmitting ? '...' : 'Log in'}
              </Button>
            </div>
          )}
        />
      </form>
    </div>
  );
};

export default LoginForm;

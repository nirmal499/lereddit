import { FormControl, FormLabel, Input, FormErrorMessage } from '@chakra-ui/react';
import { useField } from 'formik';
import React from 'react';


type InputFieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
    label:string;
    name:string;
};


// !!error
// if error = '' then isInvalid = {false}
// if error = 'error message stuff' then isInvalid = {true}

export const InputField: React.FC<InputFieldProps> = ({label, size:_ , ...props})=>{
    const [field,{error,}] = useField(props);
    return(
        <FormControl isInvalid={!!error}>
            <FormLabel htmlFor={props.name}>{label}</FormLabel>
            <Input {...field} {...props} id={props.name}/>
            {error ? <FormErrorMessage>{error}</FormErrorMessage> : null }
        </FormControl>
    );
}
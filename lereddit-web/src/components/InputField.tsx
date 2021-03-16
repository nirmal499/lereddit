import { FormControl, FormLabel, Input, FormErrorMessage, Textarea } from '@chakra-ui/react';
import { useField } from 'formik';
import React from 'react';


type InputFieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
    label:string;
    name:string;
    textarea?:boolean;
}


// !!error
// if error = '' then isInvalid = {false}
// if error = 'error message stuff' then isInvalid = {true}

export const InputField: React.FC<InputFieldProps> = ({label,textarea, size:_ , ...props})=>{
    
    const [field,{error,}] = useField(props);

    return(
        <FormControl isInvalid={!!error}>
            <FormLabel htmlFor={field.name}>{label}</FormLabel>
            {textarea ? <Textarea {...field} id={field.name}/> : <Input {...field} {...props} id={field.name}/>}
            {error ? <FormErrorMessage>{error}</FormErrorMessage> : null }
        </FormControl>
    );

}
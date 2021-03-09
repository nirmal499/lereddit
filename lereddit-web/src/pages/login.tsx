import React from 'react';
import { Form, Formik} from 'formik';
// formik provides us isSubmitting, setErrors
import { Box, Button } from '@chakra-ui/react';
import { Wrapper } from '../components/Wrapper';
import { InputField } from '../components/InputField';
import { useLoginMutation } from '../generated/graphql';
import { toErrorMap } from '../utils/toErrorMap';
import {useRouter} from 'next/router'


interface LoginProps{

}


const Login: React.FC<LoginProps> = ({})=>{

    // we can access the router using this hook
    const router = useRouter();


    // useLoginMutation is the hook created by graphql-code-generator
    const [{},login] = useLoginMutation();
    return(
        <Wrapper variant='small'>
            <Formik initialValues={{username:"",password:""}} onSubmit={async (values,{setErrors}) =>{
                //console.log(values);
                const response = await login({options: values});

                /**
                 * The errors that we are getting back from graqhql is an array that look like this
                 * [{ field:'username' , message:"something went wrong"}]
                 * So, the toErrorMap converts the array into an object
                 */
                if(response.data?.login.errors){
                    setErrors(toErrorMap(response.data.login.errors));
                }else if(response.data?.login.user){
                    // It worked means no errors
                    router.push("/");

                }
            }}>
                {({values,handleChange,isSubmitting})=>(
                    <Form>
                        {/* <FormControl>
                                <FormLabel htmlFor="username">Username</FormLabel>
                                <Input value={values.username} onChange={handleChange} id="username" placeholder="username" />
                        </FormControl> */}
                        <InputField name="username" placeholder="username" label="Username"/>
                        <Box mt={4} >
                            <InputField name="password" placeholder="password" label="Password" type="password"/>
                        </Box>
                        <Button mt={4} type="submit" isLoading={isSubmitting} colorScheme="teal">Login</Button>
                    </Form>
                )}
            </Formik>
        </Wrapper>
    );
}

export default Login;
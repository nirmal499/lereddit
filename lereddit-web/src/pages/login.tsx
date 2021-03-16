import React from 'react';
import { Form, Formik} from 'formik';
// formik provides us isSubmitting, setErrors
import { Box, Button, Flex, Link } from '@chakra-ui/react';
import { Wrapper } from '../components/Wrapper';
import { InputField } from '../components/InputField';
import { useLoginMutation } from '../generated/graphql';
import { toErrorMap } from '../utils/toErrorMap';
import {useRouter} from 'next/router'
import { withUrqlClient } from 'next-urql';
import { createUrqlClient } from '../utils/createUrqlClient';
import NextLink from "next/link";

interface LoginProps{

}


const Login: React.FC<LoginProps> = ({})=>{

    // we can access the router using this hook
    const router = useRouter();
    //console.log(router);

    // useLoginMutation is the hook created by graphql-code-generator
    const [{},login] = useLoginMutation();
    return(
        <Wrapper variant='small'>
            <Formik initialValues={{username:"",email:"",password:""}} onSubmit={async (values,{setErrors}) =>{
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
                    if(typeof router.query.next === 'string'){
                        // It worked means no errors
                        router.push(router.query.next || "/");

                    }else{
                        router.push("/");
                    }

                }
            }}>
                {({values,handleChange,isSubmitting})=>(
                    <Form>
                        {/* <FormControl>
                                <FormLabel htmlFor="username">Username</FormLabel>
                                <Input value={values.username} onChange={handleChange} id="username" placeholder="username" />
                        </FormControl> */}
                        <Box mt={4} >
                            <InputField name="username" placeholder="username" label="Username"/>
                        </Box>
                        <Box mt={4} >
                            <InputField name="email" placeholder="email" label="Email"/>
                        </Box>
                        <Box mt={4} >
                            <InputField name="password" placeholder="password" label="Password" type="password"/>
                        </Box>
                        
                        <Flex mt={2}>
                            <NextLink href="/forgot-password">
                                <Link ml="auto">Forgot Password</Link>
                            </NextLink>
                        </Flex>

                        <Button mt={4} type="submit" isLoading={isSubmitting} colorScheme="teal">Login</Button>

                    </Form>
                )}
            </Formik>
        </Wrapper>
    );
}

export default withUrqlClient(createUrqlClient,{ssr:true})(Login);
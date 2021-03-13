import React from 'react';
import { Form, Formik} from 'formik';
// formik provides us isSubmitting, setErrors
import { Box, Button } from '@chakra-ui/react';
import { Wrapper } from '../components/Wrapper';
import { InputField } from '../components/InputField';
import { useMutation } from 'urql';
import { useRegisterMutation } from '../generated/graphql';
import { toErrorMap } from '../utils/toErrorMap';
import {Router, useRouter} from 'next/router'
import { withUrqlClient } from 'next-urql';
import { createUrqlClient } from '../utils/createUrqlClient';


interface registerProps{

}

/*
The value of obj.first is confirmed to be non-null (and non-undefined) before then accessing the value of obj.first.second. 
This prevents the error that would occur if you accessed obj.first.second directly without testing obj.first.

With the optional chaining operator (?.), however, you don't have to explicitly test and 
short-circuit based on the state of obj.first before trying to access obj.first.second

let nestedProp = obj.first?.second;

By using the ?. operator instead of just ., JavaScript knows to implicitly check to be sure obj.first is not null or undefined before attempting to access obj.first.second.
If obj.first is null or undefined, the expression automatically short-circuits, returning undefined.

*/


// ! -> Makes sure that the variable is not null
const REGISTER_MUT = `mutation Register($username:String!,$password:String!){
    register(options: { username: $username, password: $password }) {
      errors {
        field
        message
      }
      user {
        id
        createdAt
        updatedAt
        username
      }
    }
  }`


const Register: React.FC<registerProps> = ({})=>{

    // we can access the router using this hook
    const router = useRouter();



    //const [{},register] = useMutation(REGISTER_MUT);

    // useRegisterMutation is the hook created by graphql-code-generator
    const [{},register] = useRegisterMutation();
    return(
        <Wrapper variant='small'>
            <Formik initialValues={{username:"",email:"",password:""}} onSubmit={async (values,{setErrors}) =>{
                //console.log(values);
                const response = await register(values);

                /**
                 * The errors that we are getting back from graqhql is an array that look like this
                 * [{ field:'username' , message:"something went wrong"}]
                 * So, the toErrorMap converts the array into an object
                 */
                if(response.data?.register.errors){
                    setErrors(toErrorMap(response.data.register.errors));
                }else if(response.data?.register.user){
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
                        <Box mt={4} >
                            <InputField name="username" placeholder="username" label="Username"/>
                        </Box>
                        <Box mt={4} >
                            <InputField name="email" placeholder="email" label="Email"/>
                        </Box>
                        <Box mt={4} >
                            <InputField name="password" placeholder="password" label="Password" type="password"/>
                        </Box>
                        {/* <InputField name="username" placeholder="username" label="Username"/>
                        <Box mt={4} >
                            <InputField name="password" placeholder="password" label="Password" type="password"/>
                        </Box> */}
                        <Button mt={4} type="submit" isLoading={isSubmitting} colorScheme="teal">Register</Button>
                    </Form>
                )}
            </Formik>
        </Wrapper>
    );
}

export default withUrqlClient(createUrqlClient,{ssr:true})(Register);
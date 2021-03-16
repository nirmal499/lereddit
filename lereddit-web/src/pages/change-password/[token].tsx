import { Box, Button, Flex, Link } from '@chakra-ui/react';
import { Form, Formik } from 'formik';
import { NextPage } from 'next';
import { withUrqlClient } from 'next-urql';
import { useRouter } from 'next/router';
import React, { useState } from 'react';
import { InputField } from '../../components/InputField';
import { Wrapper } from '../../components/Wrapper';
import { useChangePasswordMutation } from '../../generated/graphql';
import { createUrqlClient } from '../../utils/createUrqlClient';
import { toErrorMap } from '../../utils/toErrorMap';
import NextLink  from "next/link";


const ChangePassword: NextPage<{ /*token?: string*/}> = ({ /*token*/ }) => {
    const router = useRouter();
    // console.log(router);
    const [{},changePassword] = useChangePasswordMutation();
    const [tokenError,setTokenError] = useState('');

    return(
        <Wrapper variant='small'>
            <Formik initialValues={{ newPassword:""}} 
            onSubmit={async ( values,{ setErrors }) =>{
                //console.log(values);
                
                /**
                 * 
                 * You can now use the non-null assertion operator (!) that is here exactly for your use case.
                 * It tells TypeScript that even though something looks like it could be null, it can trust you that it's not
                 */
                // const tokenRecieved = token!;
                const response = await changePassword({
                    token:/*tokenRecieved*/ typeof router.query.token == 'string' ? router.query.token : "",
                    newPassword: values.newPassword
                })

                /**
                 * The errors that we are getting back from graqhql is an array that look like this
                 * [{ field:'username' , message:"something went wrong"}]
                 * So, the toErrorMap converts the array into an object
                 */
                if(response.data?.changePassword.errors){

                    const errorMap = toErrorMap(response.data.changePassword.errors);

                    if( 'token' in errorMap){
                        // If errorMap contains tokenError
                        setTokenError(errorMap.token);
                    }else{
                        setErrors(errorMap);
                    }

                }else if(response.data?.changePassword.user){
                    // It worked means no errors
                    router.push("/");

                }
            }}>
                {({values,handleChange,isSubmitting})=>(
                    <Form>
                        
                        <Box mt={4} >
                            <InputField name="newPassword" placeholder="newPassword" label="New Password" type="password"/>
                        </Box>
                        <Button mt={4} type="submit" isLoading={isSubmitting} colorScheme="teal">Change Password</Button>
                        { tokenError ? (
                            <Flex>
                                    <Box mr={2} style={{color:'red'}}>{tokenError}</Box>
                                    <NextLink href="/forgot-password">
                                        <Link>Click Here to Get a New One</Link>
                                    </NextLink>
                            </Flex>
                            ) : null }
                    </Form>
                )}
            </Formik>
        </Wrapper>
    );
}

// Special function provided by NextJS
// This allows us to get any query parameter and pass it to the above component
// ChangePassword.getInitialProps = ({query}) => {
//     return {
//         token: query.token as string,
//     };
// };

export default withUrqlClient(createUrqlClient)(ChangePassword);
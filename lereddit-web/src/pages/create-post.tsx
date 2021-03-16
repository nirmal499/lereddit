import React, { useEffect } from 'react';
import { Form, Formik} from 'formik';
// formik provides us isSubmitting, setErrors
import { Box, Button} from '@chakra-ui/react';
import { InputField } from '../components/InputField';
import { useCreatePostMutation, useMeQuery } from '../generated/graphql';
import {  useRouter } from 'next/router';
import { withUrqlClient } from 'next-urql';
import { createUrqlClient } from '../utils/createUrqlClient';
import { Layout } from '../components/Layout';
import { useIsAuth } from '../utils/useIsAuth';

const CreatePost: React.FC<{}> = ({}) => {
    

    const router = useRouter();

    useIsAuth();

    const [,createPost] = useCreatePostMutation();

    return(
        <Layout variant='small'>
            <Formik initialValues={{title: "",text:""}} onSubmit={async (values,{setErrors}) =>{
                //console.log(values);
                const {error} = await createPost({input:values});

                // Error is Handled in GLOBAL ERROR HANDLER in createUrqlClient.ts
                if(!error){
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
                            <InputField name="title" placeholder="title" label="Title"/>
                        </Box>
                        <Box mt={4} >
                            <InputField textarea name="text" placeholder="text..." label="Body"/>
                        </Box>

                        <Button mt={4} type="submit" isLoading={isSubmitting} colorScheme="teal">Create Post</Button>

                    </Form>
                )}
            </Formik>
        </Layout>
    )
}

export default withUrqlClient(createUrqlClient)(CreatePost);
import { withUrqlClient } from 'next-urql';
import { createUrqlClient } from "../utils/createUrqlClient";
import { usePostsQuery } from "../generated/graphql";
import NextLink from "next/link";
import React, { useState } from "react";
import { Layout } from "../components/Layout";
import { Box, Button, Flex, Heading, Link, Stack,Text } from "@chakra-ui/react";

const Index = () => {

  const [variables,setVariables] = useState({
    limit: 10,
    cursor: null
  })

  const [{data,fetching}] = usePostsQuery({
    variables: variables
  });

  //console.log("variables:",variables);
  //console.log("data:",data);
  

  // If we are not loading(fetching) and we did not get data
  if(!fetching && !data){
    return (<div>You Got Query Failed For Some Reason</div>);
  }

  return (
    <Layout>
      <Flex align="center">
        <Heading>LeReddit</Heading>
        <NextLink href="/create-post">
          <Link ml="auto" >Create Post</Link>
        </NextLink>
      </Flex>
        <div>WELCOME</div>
        <br/>
        
        {!data && fetching ? (<div>Loading...</div>) : (

          <Stack spacing={8}>
            {/* Here with data! we are telling typescript that we know data object will always be defined. Trust me */}
            {data!.posts.posts.map((p) => (
              <Box key={p.id} p={5} shadow="md" borderWidth="1px">
                <Heading fontSize="xl">{p.title}</Heading>
                <Text mt={4}>{p.textSnippet}</Text>
              </Box>

            ))}
          </Stack>
        )}
        {data?.posts.posts.length && data.posts.hasMore ? (<Flex>
          <Button onClick={() => {
            setVariables({
              limit: variables.limit,
              cursor: data.posts.posts[data.posts.posts.length - 1].createdAt
            })
          }} isLoading={fetching} m="auto" my={8}>Load More</Button>
        </Flex>) : null }
    </Layout>
  )
}

// Higher Order function 
export default withUrqlClient(createUrqlClient,{ssr:true})(Index);

// ssr -> server side rendering


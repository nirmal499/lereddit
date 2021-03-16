import NavBar from "../components/NavBar";
import { withUrqlClient } from 'next-urql';
import { createUrqlClient } from "../utils/createUrqlClient";
import { usePostsQuery } from "../generated/graphql";
import NextLink from "next/link";
import React from "react";
import { Layout } from "../components/Layout";
import { Link } from "@chakra-ui/react";

const Index = () => {
  const [{data}] = usePostsQuery();
  return (
    <Layout>
      <NextLink href="/create-post">
        <Link>Create Post</Link>
      </NextLink>
        <div>WELCOME</div>
        <br/>
        {!data ? <div>Loading...</div> : data.posts.map(p => <div key={p.id}>{p.title}</div>)}
    </Layout>
  )
}

// Higher Order function 
export default withUrqlClient(createUrqlClient,{ssr:true})(Index);

// ssr -> server side rendering


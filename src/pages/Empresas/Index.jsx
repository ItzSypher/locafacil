// import React from 'react'
import Topbar from '../../components/Topbar/Index'
import Footer from '../../components/Footer/Index'
import Header from './Header'
import Content from './Content'

export default function Home() {
  return (
    <div>
      <Topbar />
      <Header />
      <Content />
      <Footer />
    </div>
  )
}
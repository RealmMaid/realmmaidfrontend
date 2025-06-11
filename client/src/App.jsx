// find this part in your App.jsx
<Routes>
  <Route element={<MainLayout />}>
    <Route path="/" element={<HomePage />} />
    <Route path="/products" element={<ProductsPage />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register"={<RegisterPage />} />
    <Route path="/please-verify" element={<PleaseVerifyPage />} />
  </Route>
  
  {/* ... the rest of your routes ... */}
</Routes>

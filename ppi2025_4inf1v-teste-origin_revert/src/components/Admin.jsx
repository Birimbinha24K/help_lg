import { useContext, useState, useEffect } from "react";
import styles from "./Admin.module.css";
import { CartContext } from "../context/CartContext";

export function Admin() {
  const {
    products,
    loading,
    error,
    addProductToDB,
    updateProductInDB,
    deleteProductFromDB,
    session,
    userProfile,
    isAdmin,
  } = useContext(CartContext);

  const [newProduct, setNewProduct] = useState({
    title: "",
    price: "",
    description: "",
    thumbnail: "",
  });

  const [editing, setEditing] = useState(null);

  useEffect(() => {
    if (!isAdmin) return;
  }, [isAdmin]);

  async function handleCreate(e) {
    e.preventDefault();
    try {
      const payload = {
        title: newProduct.title,
        price: Number(newProduct.price) || 0,
        description: newProduct.description,
        thumbnail: newProduct.thumbnail,
      };
      await addProductToDB(payload);
      setNewProduct({ title: "", price: "", description: "", thumbnail: "" });
    } catch (err) {
      console.error(err);
      alert("Erro ao criar produto: " + err.message);
    }
  }

  async function handleUpdate(e) {
    e.preventDefault();
    try {
      const updates = {
        title: editing.title,
        price: Number(editing.price) || 0,
        description: editing.description,
        thumbnail: editing.thumbnail,
      };
      await updateProductInDB(editing.id, updates);
      setEditing(null);
    } catch (err) {
      console.error(err);
      alert("Erro ao atualizar produto: " + err.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Confirm delete product?")) return;
    try {
      await deleteProductFromDB(id);
    } catch (err) {
      console.error(err);
      alert("Erro ao deletar produto: " + err.message);
    }
  }

  if (!session) {
    return <div className={styles.container}>Faça login para acessar o painel.</div>;
  }

  if (!isAdmin) {
    return <div className={styles.container}>Acesso negado. Você não é administrador.</div>;
  }

  return (
    <div className={styles.container}>
      <h2>Admin — Gerenciar Produtos</h2>

      <section className={styles.section}>
        <h3>Criar produto</h3>
        <form onSubmit={handleCreate} className={styles.form}>
          <input placeholder="Title" value={newProduct.title} onChange={(e)=>setNewProduct(prev=>({...prev,title:e.target.value}))} required />
          <input placeholder="Price" value={newProduct.price} onChange={(e)=>setNewProduct(prev=>({...prev,price:e.target.value}))} required />
          <input placeholder="Thumbnail URL" value={newProduct.thumbnail} onChange={(e)=>setNewProduct(prev=>({...prev,thumbnail:e.target.value}))} />
          <textarea placeholder="Description" value={newProduct.description} onChange={(e)=>setNewProduct(prev=>({...prev,description:e.target.value}))} />
          <button type="submit">Criar</button>
        </form>
      </section>

      <section className={styles.section}>
        <h3>Produtos existentes</h3>
        {loading && <p>Carregando produtos...</p>}
        {error && <p className={styles.error}>Erro: {error}</p>}
        <div className={styles.list}>
          {products.map((p) => (
            <div key={p.id} className={styles.card}>
              {editing?.id === p.id ? (
                <form onSubmit={handleUpdate} className={styles.editForm}>
                  <input value={editing.title} onChange={(e)=>setEditing(prev=>({...prev,title:e.target.value}))} required />
                  <input value={editing.price} onChange={(e)=>setEditing(prev=>({...prev,price:e.target.value}))} required />
                  <input value={editing.thumbnail} onChange={(e)=>setEditing(prev=>({...prev,thumbnail:e.target.value}))} />
                  <textarea value={editing.description} onChange={(e)=>setEditing(prev=>({...prev,description:e.target.value}))} />
                  <div className={styles.row}>
                    <button type="submit">Salvar</button>
                    <button type="button" onClick={()=>setEditing(null)}>Cancelar</button>
                  </div>
                </form>
              ) : (
                <> 
                  <div className={styles.cardHeader}>
                    <strong>{p.title}</strong>
                    <span>R$ {Number(p.price).toFixed(2)}</span>
                  </div>
                  {p.thumbnail && <img src={p.thumbnail} alt={p.title} className={styles.thumb} />}
                  <p className={styles.desc}>{p.description}</p>
                  <div className={styles.row}>
                    <button onClick={()=>setEditing({id:p.id,title:p.title,price:p.price,description:p.description,thumbnail:p.thumbnail})}>Editar</button>
                    <button onClick={()=>handleDelete(p.id)}>Apagar</button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default Admin;

import { useContext, useState } from "react";
import styles from "./User.module.css";
import { CartContext } from "../context/CartContext";

export function User() {
  const {
    session,
    handleSignOut,
    userProfile,
    isAdmin,
    addProductToDB,
    products,
    deleteProductFromDB,
  } = useContext(CartContext);

  const [product, setProduct] = useState({ title: "", price: "", description: "", thumbnail: "" });
  const [creating, setCreating] = useState(false);
  const [mode, setMode] = useState("add");
  const [selectedToRemove, setSelectedToRemove] = useState("");
  const [removing, setRemoving] = useState(false);

  async function handleCreate(e) {
    e.preventDefault();
    setCreating(true);
    try {
      const payload = {
        title: product.title,
        price: Number(product.price) || 0,
        description: product.description,
        thumbnail: product.thumbnail,
      };
      await addProductToDB(payload);
      alert("Produto criado com sucesso");
      setProduct({ title: "", price: "", description: "", thumbnail: "" });
    } catch (err) {
      console.error(err);
      alert("Erro ao criar produto: " + (err.message || err));
    } finally {
      setCreating(false);
    }
  }

  async function handleRemove(e) {
    e.preventDefault();
    if (!selectedToRemove) return alert("Selecione um produto");
    if (!confirm("Confirma remover o produto selecionado?")) return;
    setRemoving(true);
    try {
      await deleteProductFromDB(selectedToRemove);
      alert("Produto removido com sucesso");
      setSelectedToRemove("");
    } catch (err) {
      console.error(err);
      alert("Erro ao remover produto: " + (err.message || err));
    } finally {
      setRemoving(false);
    }
  }

  function displayUsername() {
    if (userProfile && userProfile.username) return userProfile.username;
    if (session && session.user && session.user.user_metadata && session.user.user_metadata.username) return session.user.user_metadata.username;
    return "";
  }

  function displayEmail() {
    if (userProfile && userProfile.email) return userProfile.email;
    if (session && session.user && session.user.email) return session.user.email;
    return "";
  }

  return (
    <div>
      {session ? (
        <div className={styles.container}>
          <div className={styles.welcomeHeader}>
            <h2 className={styles.welcomeTitle}>Bem-vindo</h2>
            <div className={styles.welcomeName}>{displayUsername() || displayEmail() || 'Usuário'}</div>
          </div>

          <div className={styles.userCard}>
            <div className={styles.userField}>
              <div className={styles.userLabel}>Nome</div>
              <div className={styles.userValue}>{displayUsername() || '—'}</div>
            </div>
            <div className={styles.userField}>
              <div className={styles.userLabel}>Email</div>
              <div className={styles.userValue}>{displayEmail() || '—'}</div>
            </div>
            <div className={styles.userField}>
              <div className={styles.userLabel}>Papel</div>
              <div className={styles.userValue}>{isAdmin ? <span className={styles.adminBadge}>ADMIN</span> : <span className={styles.userTag}>Usuário</span>}</div>
            </div>
          </div>

          {isAdmin && (
              <section style={{ marginTop: "2rem", width: "100%", display: "flex", justifyContent: "center" }}>
                <div className={styles.adminCard}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h2 className={styles.adminTitle}>{mode === "add" ? "Adicionar produto à loja" : "Remover produto da loja"}</h2>
                    <div className={styles.adminToggle}>
                      <button type="button" onClick={() => setMode("add")} className={styles.button} style={{ opacity: mode === "add" ? 1 : 0.7 }}>Adicionar</button>
                      <button type="button" onClick={() => setMode("remove")} className={styles.button} style={{ opacity: mode === "remove" ? 1 : 0.7 }}>Remover</button>
                    </div>
                  </div>

                  {mode === "add" ? (
                    <form onSubmit={handleCreate} className={styles.adminFormField}>
                      <input className={styles.adminInput} placeholder="Título" value={product.title} onChange={(e) => setProduct(prev => ({ ...prev, title: e.target.value }))} required />
                      <input className={styles.adminInput} placeholder="Preço" value={product.price} onChange={(e) => setProduct(prev => ({ ...prev, price: e.target.value }))} required />
                      <input className={styles.adminInput} placeholder="URL da imagem (thumbnail)" value={product.thumbnail} onChange={(e) => setProduct(prev => ({ ...prev, thumbnail: e.target.value }))} />
                      <textarea className={styles.adminTextarea} placeholder="Descrição" value={product.description} onChange={(e) => setProduct(prev => ({ ...prev, description: e.target.value }))} />
                      <div className={styles.adminActions}>
                        <button className={styles.button} type="submit" disabled={creating}>{creating ? "Criando..." : "Adicionar produto"}</button>
                      </div>
                    </form>
                  ) : (
                    <form onSubmit={handleRemove} className={styles.adminFormField}>
                      <label htmlFor="removeSelect">Selecione o produto para remover:</label>
                      <select id="removeSelect" className={styles.adminSelect} value={selectedToRemove} onChange={(e) => setSelectedToRemove(e.target.value)}>
                        <option value="">-- selecione --</option>
                        {products && products.map((p) => (
                          <option key={p.id} value={p.id}>{p.title}</option>
                        ))}
                      </select>
                      <div className={styles.removeActions}>
                        <button className={styles.button} type="submit" disabled={removing}>{removing ? "Removendo..." : "Remover"}</button>
                      </div>
                    </form>
                  )}
                </div>
              </section>
            )}

          <button className={`${styles.button} ${styles.signOut}`} onClick={handleSignOut}>
            SIGN OUT
          </button>

        </div>
      ) : (
        <div className={styles.container}>
          <h1>User not signed in!</h1>
        </div>
      )}
    </div>
  );
}
